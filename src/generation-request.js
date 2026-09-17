import { getSettingsOptions, SETTINGS_DEFAULTS } from './components/settings-data.js';

const valueOrDefault = (mode, key, value) => {
  const options = getSettingsOptions(mode, key);
  return options.some(option => option.value === value) ? value : SETTINGS_DEFAULTS[mode]?.[key];
};
export function ratioValue(ratio, fallback = 4 / 3) {
  const [width, height] = String(ratio).split(':').map(Number);
  return width > 0 && height > 0 ? width / height : fallback;
}
export function durationSeconds(value, fallback = null) {
  if (!value || value === 'Авто') return fallback;
  const amount = Number.parseInt(value, 10);
  return Number.isFinite(amount) && amount > 0 ? amount * (/мин/.test(value) ? 60 : 1) : fallback;
}
export function outputDimensions(mode, ratio, quality) {
  const aspect = ratioValue(ratio, mode === 'video' ? 16 / 9 : 4 / 3);
  const size = mode === 'video'
    ? ({ '720p': 720, '1080p': 1080, '1440p': 1440, '4K': 2160 }[quality] || 720)
    : ({ '1K': 1024, '2K': 2048, '3K': 3072, '4K': 4096, '8K': 8192 }[quality] || 1024);
  if (mode === 'video') return aspect >= 1 ? { width: Math.round(size * aspect), height: size } : { width: size, height: Math.round(size / aspect) };
  return aspect >= 1 ? { width: size, height: Math.round(size / aspect) } : { width: Math.round(size * aspect), height: size };
}
const isImageFile = file => Boolean(file?.url) && (String(file.mime || file.type || '').startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name || ''));
export function chatImageReferences(messages = []) {
  const items = [];
  for (const message of messages) {
    for (const file of message.files || []) if (isImageFile(file)) items.push(file);
    if (message.media?.type === 'image' && message.media.ready) {
      const variants = message.media.variants?.length ? message.media.variants : [message.media];
      variants.forEach((media, index) => items.push({ id: media.id || (index === 0 ? message.id : `${message.id}-${index}`), name: media.title || 'Изображение из чата', url: media.src, mime: 'image/png' }));
    }
  }
  return items.filter((item, index) => items.findLastIndex(other => other.url === item.url) === index);
}

// This is also the future API boundary. A request snapshots every selected
// control so switching modes while a result is streaming cannot alter it.
export function createGenerationRequest({ mode = 'auto', model, settings = {}, text = '', attachments = [], refs = [], messages = [] }) {
  const options = { ...settings };
  for (const key of Object.keys(SETTINGS_DEFAULTS[mode] || {})) {
    if (key !== 'role') options[key] = valueOrDefault(mode, key, key === 'voice' && settings[key] === 'Женский' ? 'Аля' : settings[key]);
  }
  options.role = !settings.role || settings.role === 'Без роли' ? '' : settings.role;
  for (const key of ['web', 'reasoning', 'sound', 'lastImage', 'chatImages', 'backgroundMusic']) options[key] = Boolean(settings[key]);
  const images = chatImageReferences(messages);
  const fromChat = mode === 'video' ? options.chatImages ? images : options.lastImage ? images.slice(-1) : [] : [];
  const allReferences = [...refs.filter(Boolean), ...attachments.filter(isImageFile), ...fromChat];
  const references = allReferences.filter((file, index) => allReferences.findIndex(other => (other.id && other.id === file.id) || other.url === file.url) === index);
  const ratio = options.ratio === 'Авто' || !options.ratio ? mode === 'video' ? '16:9' : '4:3' : options.ratio;
  return {
    mode, model, text, settings: options,
    attachments: [...attachments], references,
    ratio,
    ...(mode === 'image' || mode === 'video' ? outputDimensions(mode, ratio, options.quality) : {}),
    count: mode === 'image' ? Math.min(4, Math.max(1, Number.parseInt(options.count, 10) || 1)) : 1,
    duration: durationSeconds(options.duration),
  };
}

export function createDemoMedia(request, imageSources = []) {
  const { mode, model, text: title, settings, ratio, width, height, duration } = request;
  const base = { type: mode, model, title, ready: false, settings, ratio, width, height, duration, references: request.references.map(({ id, name, mime, url }) => ({ id, name, mime, ...(url && !url.startsWith("blob:") ? { url } : {}) })) };
  if (mode === 'image') {
    const sources = imageSources.filter(Boolean);
    if (!sources.length) return null;
    const variants = Array.from({ length: request.count }, (_, index) => ({ ...base, src: sources[index % sources.length] }));
    return { ...variants[0], ...(variants.length > 1 ? { variants } : {}) };
  }
  if (mode === 'video') return { ...base, src: '/media/creative-demo.mp4', poster: '/media/creative-demo.jpg', sound: settings.sound };
  if (mode === 'audio') return { ...base, src: '/media/ambient-demo.wav', poster: '/media/artwork/orange-bloom.jpg', voice: settings.voice, language: settings.language, backgroundMusic: settings.backgroundMusic };
  return null;
}

export function describeRequestOptions(request) {
  const { mode, settings, references } = request;
  if (mode === 'image') return `${settings.ratio} · ${settings.quality} · ${settings.count}`;
  if (mode === 'video') return `${settings.ratio} · ${settings.quality} · ${settings.duration} · ${settings.sound ? 'со звуком' : 'без звука'}${references.length ? ` · референсов: ${references.length}` : ''}`;
  if (mode === 'audio') return `${settings.voice} · ${settings.language} · ${settings.duration} · ${settings.backgroundMusic ? 'с фоновой музыкой' : 'без фоновой музыки'}`;
  return [mode === 'auto' ? `Скорость: ${settings.speed}` : null, settings.role ? `Роль: ${settings.role}` : null, settings.web ? 'Поиск в сети включён' : null, settings.reasoning ? 'Исследование включено' : null].filter(Boolean).join(' · ');
}

export function sanitizeGenerationRequest(request) {
  if (!request || typeof request !== 'object') return undefined;
  const cleanFiles = files => (files || []).map(({ raw, url, preview, ...file }) => ({ ...file, ...(url && !url.startsWith('blob:') ? { url } : {}), ...(preview && !preview.startsWith('blob:') ? { preview } : {}) }));
  return { ...request, attachments: cleanFiles(request.attachments), references: cleanFiles(request.references) };
}
