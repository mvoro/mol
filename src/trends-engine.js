import { withBasePath } from './base-path.js';
import { withTrendVideoDuration } from './trends-webm.js';

export const TREND_TEMPLATES = [
  { id: 'close-up', name: 'Ближе к вам', category: 'camera', motion: 'zoom-in', duration: 6, poster: '/media/trends/studio.png', tag: 'Популярное', description: 'Плавное приближение к лицу' },
  { id: 'reveal', name: 'Весь образ', category: 'camera', motion: 'zoom-out', duration: 6, poster: '/media/trends/street.png', description: 'От крупного плана к общему' },
  { id: 'editorial', name: 'Обложка', category: 'camera', motion: 'pan-left', duration: 6, poster: '/media/trends/sunset.png', tag: 'Новое', description: 'Камера мягко движется влево' },
  { id: 'side-glance', name: 'Другой ракурс', category: 'camera', motion: 'pan-right', duration: 6, poster: '/media/trends/neon.png', description: 'Горизонтальное движение вправо' },
  { id: 'float', name: 'Невесомость', category: 'motion', motion: 'float', duration: 6, poster: '/media/trends/sunset.png', description: 'Плавное покачивание кадра' },
  { id: 'rhythm', name: 'В ритме', category: 'motion', motion: 'pulse', duration: 6, poster: '/media/trends/neon.png', description: 'Ритмичное приближение и отдаление' },
  { id: 'rise', name: 'На высоте', category: 'camera', motion: 'rise', duration: 6, poster: '/media/trends/street.png', description: 'Плавный проход камеры снизу вверх' },
  { id: 'swing', name: 'Лёгкий поворот', category: 'motion', motion: 'swing', duration: 6, poster: '/media/trends/studio.png', description: 'Небольшой наклон кадра по дуге' },
].map(template => ({ ...template, poster: withBasePath(template.poster) }));
export const DEFAULT_TREND_DRAFT = { templateId: '', caption: '', quality: '720', character: null };
export const MAX_CHARACTER_BYTES = 15 * 1024 * 1024;
export const getTrendTemplate = id => TREND_TEMPLATES.find(template => template.id === id);
export function validateCharacter(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Выберите фото в формате JPG, PNG или WebP.';
  if (file.size > MAX_CHARACTER_BYTES) return 'Фото должно весить не больше 15 МБ.';
  if (!file.size) return 'Этот файл пуст. Выберите другое фото.';
  return '';
}
export function validateTrendDraft(draft) {
  if (!getTrendTemplate(draft.templateId)) return 'Сначала выберите движение из коллекции.';
  if (!draft.character?.blob) return 'Добавьте фото персонажа.';
  if (!['720', '1080'].includes(draft.quality)) return 'Выберите качество видео.';
  if (draft.caption.length > 160) return 'Сократите подпись до 160 символов.';
  return '';
}
export function trendTransform(motion, progress) {
  const t = Math.max(0, Math.min(1, progress));
  const ease = t * t * (3 - 2 * t);
  const loop = Math.sin(t * Math.PI * 2);
  switch (motion) {
    case 'zoom-in': return { scale: 1.03 + ease * .24, x: 0, y: -.025 * ease, rotation: 0 };
    case 'zoom-out': return { scale: 1.27 - ease * .24, x: 0, y: -.025 * (1 - ease), rotation: 0 };
    case 'pan-left': return { scale: 1.25, x: .09 - .18 * ease, y: 0, rotation: 0 };
    case 'pan-right': return { scale: 1.25, x: -.09 + .18 * ease, y: 0, rotation: 0 };
    case 'rise': return { scale: 1.25, x: 0, y: .09 - .18 * ease, rotation: 0 };
    case 'float': return { scale: 1.2, x: .025 * loop, y: .04 * Math.cos(t * Math.PI * 2), rotation: 0 };
    case 'pulse': return { scale: 1.08 + .13 * (1 - Math.cos(t * Math.PI * 4)) / 2, x: 0, y: 0, rotation: 0 };
    case 'swing': return { scale: 1.3, x: .025 * loop, y: 0, rotation: .035 * loop };
    default: return { scale: 1, x: 0, y: 0, rotation: 0 };
  }
}
export function drawTrendFrame(context, picture, template, progress, caption = '') {
  const { width, height } = context.canvas;
  const cover = Math.max(width / picture.width, height / picture.height);
  const transform = trendTransform(template.motion, progress);
  context.fillStyle = '#161616';
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2 + transform.x * width, height / 2 + transform.y * height);
  context.rotate(transform.rotation);
  const dw = picture.width * cover * transform.scale;
  const dh = picture.height * cover * transform.scale;
  context.drawImage(picture, -dw / 2, -dh / 2, dw, dh);
  context.restore();
  if (!caption.trim()) return;
  const fontSize = width * .042;
  context.font = `600 ${fontSize}px "Manrope Variable", sans-serif`;
  const maxWidth = width * .82;
  const words = caption.trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const pieces = [];
    let fragment = '';
    for (const letter of word) {
      if (context.measureText(fragment + letter).width > maxWidth && fragment) { pieces.push(fragment); fragment = ''; }
      fragment += letter;
    }
    if (fragment) pieces.push(fragment);
    for (const piece of pieces) {
      const candidate = line ? `${line} ${piece}` : piece;
      if (context.measureText(candidate).width > maxWidth && line) { lines.push(line); line = piece; } else line = candidate;
    }
  }
  if (line) lines.push(line);
  const lineHeight = fontSize * 1.35;
  const top = height * .88 - Math.max(0, lines.length - 1) * lineHeight;
  const gradient = context.createLinearGradient(0, Math.max(0, top - height * .15), 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, 'rgba(0,0,0,.68)');
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  context.fillStyle = '#fff'; context.textAlign = 'center'; context.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i++) context.fillText(lines[i], width / 2, top + i * lineHeight);
}
function abortError() { return new DOMException('Отменено', 'AbortError'); }
export async function loadTrendImage(source, signal) {
  if (signal?.aborted) throw abortError();
  return new Promise((resolve, reject) => {
    const picture = new Image();
    const clean = () => { picture.onload = null; picture.onerror = null; signal?.removeEventListener('abort', abort); };
    const abort = () => { clean(); picture.src = ''; reject(abortError()); };
    picture.onload = () => { clean(); resolve(picture); };
    picture.onerror = () => { clean(); reject(new Error('Не удалось прочитать фото. Попробуйте другой файл.')); };
    signal?.addEventListener('abort', abort, { once: true });
    picture.src = source;
  });
}
export async function renderTrendVideo(snapshot, { signal, onProgress } = {}) {
  const invalid = validateTrendDraft(snapshot);
  if (invalid) throw new Error(invalid);
  if (signal?.aborted) throw abortError();
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) throw new Error('Этот браузер не поддерживает создание видео. Откройте страницу в Chrome или Safari.');
  const template = getTrendTemplate(snapshot.templateId);
  const source = URL.createObjectURL(snapshot.character.blob);
  let stream;
  try {
    const picture = await loadTrendImage(source, signal);
    await document.fonts.ready;
    if (signal?.aborted) throw abortError();
    const canvas = document.createElement('canvas');
    canvas.width = Number(snapshot.quality); canvas.height = Number(snapshot.quality) * 16 / 9;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Не удалось создать видео. Обновите страницу и повторите.');
    drawTrendFrame(context, picture, template, 0, snapshot.caption);
    stream = canvas.captureStream(30);
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw new Error('В этом браузере нет подходящего видеоформата. Попробуйте Chrome или Safari.');
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: snapshot.quality === '1080' ? 7_000_000 : 3_500_000 });
    const blob = await new Promise((resolve, reject) => {
      let frame = 0, finished = false, timer;
      const chunks = [];
      const clean = () => { cancelAnimationFrame(frame); clearTimeout(timer); signal?.removeEventListener('abort', abort); document.removeEventListener('visibilitychange', visibility); };
      const fail = error => { if (finished) return; finished = true; clean(); try { if (recorder.state !== 'inactive') recorder.stop(); } catch { /* Stream may already have stopped. */ } reject(error); };
      const abort = () => fail(abortError());
      // A background tab throttles canvas drawing; never return a silently frozen result.
      const visibility = () => { if (document.hidden) fail(new Error('Создание видео приостановлено: вкладка была скрыта. Вернитесь и повторите генерацию.')); };
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => fail(new Error('Не удалось записать видео. Попробуйте ещё раз или выберите 720p.'));
      recorder.onstop = () => { if (finished) return; finished = true; clean(); const output = new Blob(chunks, { type: recorder.mimeType }); if (output.size) resolve(output); else reject(new Error('Видео не сохранилось. Попробуйте ещё раз.')); };
      signal?.addEventListener('abort', abort, { once: true });
      document.addEventListener('visibilitychange', visibility);
      if (signal?.aborted) { abort(); return; }
      try { recorder.start(250); } catch { fail(new Error('Не удалось начать запись. Попробуйте ещё раз или выберите 720p.')); return; }
      const start = performance.now();
      const draw = now => {
        if (finished) return;
        const progress = Math.min(1, (now - start) / (template.duration * 1000));
        drawTrendFrame(context, picture, template, progress, snapshot.caption);
        onProgress?.(Math.round(progress * 100));
        if (progress < 1) frame = requestAnimationFrame(draw); else recorder.stop();
      };
      frame = requestAnimationFrame(draw);
      timer = setTimeout(() => fail(new Error('Видео создаётся слишком долго. Попробуйте ещё раз.')), 30000);
    });
    let seekableBlob;
    try { seekableBlob = await withTrendVideoDuration(blob, template.duration); }
    catch (cause) { throw new Error('Не удалось подготовить видео к воспроизведению. Попробуйте ещё раз.', { cause }); }
    if (signal?.aborted) throw abortError();
    return { id: crypto.randomUUID(), type: 'video', title: template.name, createdAt: Date.now(), templateId: snapshot.templateId, templateName: template.name, caption: snapshot.caption, quality: snapshot.quality, duration: template.duration, character: snapshot.character, blob: seekableBlob, extension: blob.type.includes('mp4') ? 'mp4' : 'webm' };
  } finally { stream?.getTracks().forEach(track => track.stop()); URL.revokeObjectURL(source); }
}
