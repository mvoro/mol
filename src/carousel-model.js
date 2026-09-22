import { withBasePath } from './base-path.js';
import { MAX_CAROUSEL_REFERENCES, normalizeCarouselReference } from './carousel-references.js';

export const CAROUSEL_STORAGE_KEY = 'molecula-carousel-v1';

export const CAROUSEL_TEMPLATES = [
  { id: 'editorial', name: 'Редакционный', description: 'Воздух и выразительная типографика', image: '/media/carousel/editorial.png', background: '#eee9df', ink: '#253026', accent: '#697252', title: 'Меньше шума.\nБольше смысла.', eyebrow: 'ЗАМЕТКИ О ВАЖНОМ', font: 'Georgia' },
  { id: 'botanical', name: 'Живая органика', description: 'Природные формы и глубокие цвета', image: '/media/carousel/botanical.png', background: '#163529', ink: '#f5f7dd', accent: '#c1d68c', title: 'Расти\nв своём ритме.', eyebrow: 'ЕСТЕСТВЕННОЕ ВДОХНОВЕНИЕ', font: 'Georgia', dark: true },
  { id: 'chrome', name: 'Жидкий металл', description: 'Объём, хром и мягкий свет', image: '/media/carousel/chrome.png', background: '#e4e0f4', ink: '#302443', accent: '#7450d4', title: 'По ту сторону\nпривычного.', eyebrow: 'НОВЫЙ ВЗГЛЯД', font: 'Manrope Variable' },
  { id: 'collage', name: 'Коллаж', description: 'Бумажные фактуры и смелые акценты', image: '/media/carousel/collage.png', background: '#eee9dc', ink: '#27252b', accent: '#d05036', title: 'Есть идея.\nЕсть история.', eyebrow: 'СОБЕРИТЕ СВОЁ', font: 'Manrope Variable' },
  { id: 'terracotta', name: 'Терракота', description: 'Тёплая глина и архитектурные формы', image: '/media/carousel/terracotta.png', background: '#ead7c2', ink: '#573b30', accent: '#b66743', title: 'Тепло\nпростых вещей.', eyebrow: 'БЛИЖЕ К СЕБЕ', font: 'Georgia' },
  { id: 'aurora', name: 'Северное сияние', description: 'Ночной синий и мягкие переливы света', image: '/media/carousel/aurora.png', background: '#10182e', ink: '#edf4ff', accent: '#a3dbc8', title: 'Идеи, которые\nзажигают.', eyebrow: 'СВЕТ НОВЫХ ИДЕЙ', font: 'Manrope Variable', dark: true },
  { id: 'risograph', name: 'Ризограф', description: 'Зернистая печать и кобальтовые акценты', image: '/media/carousel/risograph.png', background: '#f2d7bf', ink: '#243b77', accent: '#e47855', title: 'Несовершенно.\nИ прекрасно.', eyebrow: 'РУЧНАЯ РАБОТА', font: 'Manrope Variable' },
  { id: 'marble', name: 'Мрамор', description: 'Светлый камень и тонкие золотые линии', image: '/media/carousel/marble.png', background: '#eee9e1', ink: '#484137', accent: '#aa8d5e', title: 'Ценность\nв деталях.', eyebrow: 'ВНЕ ВРЕМЕНИ', font: 'Georgia' },
  { id: 'blueprint', name: 'Чертёж', description: 'Глубокий синий и точная геометрия', image: '/media/carousel/blueprint.png', background: '#163b62', ink: '#edf4ff', accent: '#a0cee8', title: 'От замысла\nк системе.', eyebrow: 'ВСЁ НА СВОЁМ МЕСТЕ', font: 'Manrope Variable', dark: true },
  { id: 'origami', name: 'Оригами', description: 'Коралловая бумага и мягкие складки', image: '/media/carousel/origami.png', background: '#f5dbd0', ink: '#623d38', accent: '#c37764', title: 'Сложить\nсвою историю.', eyebrow: 'ПРОСТОТА ФОРМЫ', font: 'Manrope Variable' },
  { id: 'zen', name: 'Дзен', description: 'Песок, камни и спокойный ритм', image: '/media/carousel/zen.png', background: '#e7dfcf', ink: '#484a3c', accent: '#939277', title: 'Остановиться.\nУвидеть главное.', eyebrow: 'МЕСТО ДЛЯ ПАУЗЫ', font: 'Georgia' },
  { id: 'glass', name: 'Матовое стекло', description: 'Прозрачные формы и прохладная пастель', image: '/media/carousel/glass.png', background: '#e8edf1', ink: '#344451', accent: '#819fa9', title: 'Свежий взгляд\nна привычное.', eyebrow: 'ЧИСТОТА И СВЕТ', font: 'Manrope Variable' },
  { id: 'noir', name: 'Нуар', description: 'Монохромная архитектура и глубокие тени', image: '/media/carousel/noir.png', background: '#202126', ink: '#f3f1ed', accent: '#b7b5b2', title: 'Характер\nбез лишних слов.', eyebrow: 'ИГРА СВЕТА И ТЕНИ', font: 'Georgia', dark: true },
  { id: 'memphis', name: 'Мемфис', description: 'Яркая геометрия и игривые сочетания', image: '/media/carousel/memphis.png', background: '#f1eedf', ink: '#34333f', accent: '#d9534f', title: 'Больше цвета.\nБольше вас.', eyebrow: 'ПРАВИЛА МОЖНО МЕНЯТЬ', font: 'Manrope Variable' },
  { id: 'watercolor', name: 'Акварель', description: 'Полупрозрачные мазки и нежные оттенки', image: '/media/carousel/watercolor.png', background: '#f3ede3', ink: '#4a5448', accent: '#a37963', title: 'Вдохновение\nв каждом дне.', eyebrow: 'ЛЁГКОЕ ПРИКОСНОВЕНИЕ', font: 'Georgia' },
  { id: 'ceramic', name: 'Керамика', description: 'Матовые объекты на мятном фоне', image: '/media/carousel/ceramic.png', background: '#dfebe4', ink: '#365548', accent: '#809d8c', title: 'Создано\nс вниманием.', eyebrow: 'ФОРМА И ЧУВСТВО', font: 'Georgia' },
  { id: 'holographic', name: 'Голографика', description: 'Опаловые переливы и розовый свет', image: '/media/carousel/holographic.png', background: '#eee2eb', ink: '#4e3659', accent: '#a276b0', title: 'Раскройте\nновые грани.', eyebrow: 'ДРУГАЯ ПЕРСПЕКТИВА', font: 'Manrope Variable' },
  { id: 'linen', name: 'Лён', description: 'Натуральная ткань и тёплые полутона', image: '/media/carousel/linen.png', background: '#e8dfd2', ink: '#52483c', accent: '#a08b72', title: 'Естественно\nбыть собой.', eyebrow: 'НЕСПЕШНЫЕ ИСТОРИИ', font: 'Georgia' },
  { id: 'cutout', name: 'Бумажная графика', description: 'Красный, чёрный и выразительные вырезки', image: '/media/carousel/cutout.png', background: '#eee9df', ink: '#292725', accent: '#c64036', title: 'Смело.\nПо существу.', eyebrow: 'СИЛА КОНТРАСТА', font: 'Manrope Variable' },
  { id: 'neon', name: 'Неон', description: 'Ультрафиолет и электрический лайм', image: '/media/carousel/neon.png', background: '#19172b', ink: '#f2f4df', accent: '#d3ed75', title: 'На своей\nчастоте.', eyebrow: 'ЭНЕРГИЯ ДВИЖЕНИЯ', font: 'Manrope Variable', dark: true },
].map(template => ({ ...template, image: withBasePath(template.image) }));

export const CAROUSEL_FORMATS = [
  { value: '1:1', label: '1:1 · Квадрат', description: '1080 × 1080', width: 1080, height: 1080 },
  { value: '4:5', label: '4:5 · Портрет', description: '1080 × 1350', width: 1080, height: 1350 },
  { value: '9:16', label: '9:16 · Вертикальный', description: '1080 × 1920', width: 1080, height: 1920 },
];

export const DEFAULT_CAROUSEL_DRAFT = { template: 'editorial', topic: '', audience: '', count: 5, format: '4:5', styleDescription: '', references: [] };

export function validateCarouselDraft(draft) {
  const errors = {};
  if (!draft || typeof draft.topic !== 'string' || !draft.topic.trim()) errors.topic = 'Добавьте тему или текст карусели.';
  else if (draft.topic.trim().length > 2400) errors.topic = 'Сократите текст до 2400 символов.';
  if (!draft || typeof draft.audience !== 'string' || !draft.audience.trim()) errors.audience = 'Расскажите, для кого эта карусель.';
  else if (draft.audience.trim().length > 160) errors.audience = 'Сократите описание аудитории до 160 символов.';
  if (draft?.template !== 'custom' && !CAROUSEL_TEMPLATES.some(template => template.id === draft?.template)) errors.template = 'Выберите стиль карусели.';
  if (draft?.template === 'custom') {
    if (typeof draft.styleDescription !== 'string' || draft.styleDescription.trim().length < 3) errors.styleDescription = 'Опишите свой стиль хотя бы в нескольких словах.';
    else if (draft.styleDescription.trim().length > 1200) errors.styleDescription = 'Сократите описание стиля до 1200 символов.';
  }
  if (draft?.references !== undefined && (!Array.isArray(draft.references) || draft.references.length > MAX_CAROUSEL_REFERENCES || draft.references.some(reference => !normalizeCarouselReference(reference)) || new Set(draft.references.map(reference => reference.id)).size !== draft.references.length)) errors.references = 'Прикрепите до 5 фотографий в формате JPG, PNG или WebP.';
  if (!Number.isInteger(Number(draft?.count)) || Number(draft?.count) < 3 || Number(draft?.count) > 10) errors.count = 'Выберите от 3 до 10 слайдов.';
  if (!CAROUSEL_FORMATS.some(format => format.value === draft?.format)) errors.format = 'Выберите формат карусели.';
  return errors;
}

export function snapshotCarouselRequest(draft, revision = 0) {
  if (Object.keys(validateCarouselDraft(draft)).length) throw new Error('Проверьте параметры карусели.');
  const references = Object.freeze((draft.references || []).map(reference => Object.freeze(normalizeCarouselReference(reference))));
  return Object.freeze({ template: draft.template, topic: draft.topic.trim(), audience: draft.audience.trim(), count: Number(draft.count), format: draft.format, styleDescription: typeof draft.styleDescription === 'string' ? draft.styleDescription.trim().slice(0, 1200) : '', references, revision: Number.isSafeInteger(revision) && revision >= 0 ? revision : 0 });
}

function colorLuminance(color) {
  const channels = color.match(/[a-f\d]{2}/giu).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

/** Local typography and palette composition; this does not invent AI artwork from a brief. */
export function resolveCarouselStyle(request) {
  if (request?.template !== 'custom') return CAROUSEL_TEMPLATES.find(template => template.id === request?.template) || null;
  const description = typeof request.styleDescription === 'string' ? request.styleDescription : '';
  const words = description.toLocaleLowerCase('ru');
  const palettes = [
    [/т[её]мн|ночн|ч[её]рн|dark|black|night/u, '#232329', '#f6f5f2'],
    [/зел[её]н|природ|ботан|лесн|green|nature|botanic/u, '#e5ede3', '#233c2b'],
    [/син|голуб|холод|blue|cool/u, '#e6edf4', '#24394e'],
    [/розов|pink|rose/u, '#f1e4e7', '#51353d'],
    [/фиолет|сирен|лаванд|purple|lavender/u, '#eae4f3', '#40304f'],
    [/красн|оранж|террак|red|orange/u, '#f1e3d9', '#5a352a'],
    [/беж|т[её]пл|крем|песоч|бума|beige|warm|cream|paper/u, '#eee8dc', '#3e382d'],
  ];
  const palette = palettes.find(([pattern]) => pattern.test(words));
  let background = palette?.[1] || '#f2f1ee';
  let ink = palette?.[2] || '#292a2d';
  const colors = [...description.matchAll(/#([a-f\d]{6}|[a-f\d]{3})(?![a-f\d])/giu)].map(([, value]) => `#${value.length === 3 ? [...value].map(character => character.repeat(2)).join('') : value}`);
  if (colors.length) {
    background = colors[0];
    const light = colorLuminance(background);
    // Preserve text contrast even when the brief supplies a second, unreadable color.
    ink = light > .179 ? '#202024' : '#f8f7f3';
    if (colors[1]) {
      const textLight = colorLuminance(colors[1]);
      if ((Math.max(light, textLight) + .05) / (Math.min(light, textLight) + .05) >= 4.5) ink = colors[1];
    }
  }
  const serif = /засеч|редакцион|классич|книжн|serif|editorial|classic/u.test(words) && !/без засеч|sans[ -]?serif/u.test(words);
  return { id: 'custom', name: 'Свой стиль', description, image: null, background, ink, accent: ink, title: 'В вашем стиле.', eyebrow: 'ВАША ИСТОРИЯ', font: serif ? 'Georgia' : 'Manrope Variable' };
}

function trimTitle(value, length = 112) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  const truncated = text.slice(0, length - 1);
  const space = truncated.lastIndexOf(' ');
  return `${space > length * .6 ? truncated.slice(0, space) : truncated}…`;
}

function completeSentences(text) {
  if (typeof Intl.Segmenter === 'function') return [...new Intl.Segmenter('ru', { granularity: 'sentence' }).segment(text)].map(item => item.segment.trim()).filter(Boolean);
  return text.split(/(?<=[.!?])\s+/u).map(item => item.trim()).filter(Boolean);
}

function divideOversizedUnit(text, count) {
  const words = text.split(/\s+/u).filter(Boolean);
  const partCount = Math.min(count, words.length);
  const parts = [];
  let cursor = 0;
  for (let index = 0; index < partCount; index += 1) {
    const remaining = partCount - index;
    const target = words.slice(cursor).reduce((length, word) => length + word.length + 1, 0) / remaining;
    const maxEnd = words.length - remaining + 1;
    let end = cursor + 1;
    let length = words[cursor].length;
    while (end < maxEnd) {
      const combined = length + 1 + words[end].length;
      if (Math.abs(combined - target) > Math.abs(length - target)) break;
      length = combined;
      end += 1;
    }
    if (remaining === 1) end = words.length;
    parts.push(words.slice(cursor, end).join(' '));
    cursor = end;
  }
  return parts;
}

/** Prefers intact paragraphs/sentences; exceptionally long units fall back to word boundaries. */
export function divideCarouselText(text, count) {
  const paragraphs = text.split(/\n+/u).map(item => item.trim()).filter(Boolean);
  const semanticUnits = paragraphs.length >= count ? paragraphs : paragraphs.flatMap(completeSentences);
  const targetLength = Math.max(180, Math.ceil(text.length / count));
  const units = semanticUnits.flatMap(unit => unit.length > Math.max(600, targetLength * 1.15) ? divideOversizedUnit(unit, Math.ceil(unit.length / targetLength)) : [unit]);
  const groupCount = Math.min(count, units.length);
  const groups = [];
  let cursor = 0;
  for (let index = 0; index < groupCount; index += 1) {
    const remainingGroups = groupCount - index;
    const target = units.slice(cursor).reduce((length, item) => length + item.length + 2, 0) / remainingGroups;
    const maxEnd = units.length - remainingGroups + 1;
    let end = cursor + 1;
    let length = units[cursor].length;
    while (end < maxEnd) {
      const combined = length + 2 + units[end].length;
      if (Math.abs(combined - target) > Math.abs(length - target)) break;
      length = combined;
      end += 1;
    }
    if (remainingGroups === 1) end = units.length;
    groups.push(units.slice(cursor, end).join('\n\n'));
    cursor = end;
  }
  return groups;
}

export function carouselSlideCount(count) {
  const tens = Math.abs(count) % 100;
  const units = tens % 10;
  return `${count} ${tens >= 11 && tens <= 14 ? 'слайдов' : units === 1 ? 'слайд' : units >= 2 && units <= 4 ? 'слайда' : 'слайдов'}`;
}

/** A local layout composer: supplied copy is preserved; short briefs receive editable writing prompts. */
export function createCarouselResult(request, { id = `carousel-${Date.now()}`, createdAt = new Date().toISOString() } = {}) {
  const snapshot = snapshotCarouselRequest(request, request.revision || 0);
  const paragraphs = snapshot.topic.split(/\n+/u).map(text => text.trim()).filter(Boolean);
  const title = trimTitle(paragraphs[0] || snapshot.topic);
  const standaloneTitle = paragraphs.length > 1 && paragraphs[0].length <= 112;
  const longCopy = standaloneTitle || snapshot.topic.length > 180 || paragraphs.length > 2;
  const bodyCopy = standaloneTitle ? paragraphs.slice(1).join('\n\n') : snapshot.topic;
  const content = longCopy ? divideCarouselText(bodyCopy, snapshot.count - 1) : [];
  const outline = [
    ['Почему это важно', `Что в теме «${title}» особенно важно для аудитории «${snapshot.audience}»? Начните с её главного вопроса.`],
    ['С чего начать', `Выберите один понятный первый шаг по теме «${title}». Покажите, как повторить его на практике.`],
    ['Разберём на примере', `Добавьте пример из жизни аудитории «${snapshot.audience}»: исходная ситуация, действие и результат.`],
    ['На что обратить внимание', `Выделите важную деталь по теме «${title}» и объясните, как она влияет на результат.`],
    ['Частая ошибка', `Расскажите, какой ошибки стоит избегать, и предложите простое решение для аудитории «${snapshot.audience}».`],
    ['Попробуйте сами', `Превратите идею «${title}» в небольшое практическое задание. Один шаг, который можно сделать сегодня.`],
    ['Соберите главное', `Сформулируйте главный вывод по теме «${title}». Что читатель может применить прямо сейчас?`],
    ['Продолжим разговор', `Какой вопрос о теме «${title}» вы задали бы своей аудитории? Добавьте его здесь.`],
  ];
  const slides = Array.from({ length: snapshot.count }, (_, index) => {
    if (!index) return { id: `${id}-${index}`, title, body: '', kind: 'cover', kicker: snapshot.audience };
    if (longCopy && content[index - 1]) {
      const sentence = completeSentences(content[index - 1])[0];
      const heading = sentence.length <= 96 && !/^\d+[.)]?$/u.test(sentence) ? sentence.replace(/[.!?]+$/u, '') : `Часть ${index}`;
      return { id: `${id}-${index}`, title: heading, body: content[index - 1], kind: 'content', kicker: title };
    }
    if (index === snapshot.count - 1) return { id: `${id}-${index}`, title: 'Сохраните, чтобы вернуться', body: `«${title}»\n\nПоделитесь этой каруселью с теми, кому она будет полезна.`, kind: 'closing', kicker: snapshot.audience };
    const [heading, body] = outline[(index - 1) % outline.length];
    return { id: `${id}-${index}`, title: heading, body, kind: longCopy ? 'prompt' : 'content', kicker: title };
  });
  return { id, createdAt, request: snapshot, slides };
}

export function createCarouselVariant(result, { id = `carousel-${Date.now()}`, createdAt = new Date().toISOString() } = {}) {
  const request = snapshotCarouselRequest(result.request, (result.request.revision || 0) + 1);
  return { id, createdAt, request, slides: result.slides.map((slide, index) => ({ ...slide, id: `${id}-${index}` })) };
}

export function updateCarouselSlide(result, selected, key, value) {
  if (!result?.slides[selected] || !['title', 'body'].includes(key)) return result;
  return { ...result, slides: result.slides.map((slide, index) => index === selected ? { ...slide, [key]: value } : slide) };
}

export function upsertCarouselResult(results, result) {
  return result ? [result, ...results.filter(item => item.id !== result.id)].slice(0, 12) : results;
}

export function readCarouselState(storage) {
  const fallback = { draft: { ...DEFAULT_CAROUSEL_DRAFT, references: [] }, result: null, results: [], stage: 'setup', setupStep: 1, selected: 0 };
  try {
    const saved = JSON.parse(storage.getItem(CAROUSEL_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    const draft = { ...DEFAULT_CAROUSEL_DRAFT, references: [] };
    if (typeof saved.draft?.topic === 'string') draft.topic = saved.draft.topic.slice(0, 2400);
    if (typeof saved.draft?.audience === 'string') draft.audience = saved.draft.audience.slice(0, 160);
    if (saved.draft?.template === 'custom' || CAROUSEL_TEMPLATES.some(item => item.id === saved.draft?.template)) draft.template = saved.draft.template;
    if (typeof saved.draft?.styleDescription === 'string') draft.styleDescription = saved.draft.styleDescription.slice(0, 1200);
    if (Array.isArray(saved.draft?.references)) {
      const seen = new Set();
      draft.references = saved.draft.references.map(normalizeCarouselReference).filter(reference => reference && !seen.has(reference.id) && seen.add(reference.id)).slice(0, MAX_CAROUSEL_REFERENCES);
    }
    if (CAROUSEL_FORMATS.some(item => item.value === saved.draft?.format)) draft.format = saved.draft.format;
    if (Number.isInteger(saved.draft?.count) && saved.draft.count >= 3 && saved.draft.count <= 10) draft.count = saved.draft.count;
    const restoreResult = value => {
      if (!value || typeof value.id !== 'string' || value.id.length > 200 || Object.keys(validateCarouselDraft(value.request)).length || !Array.isArray(value.slides) || value.slides.length !== Number(value.request.count) || !value.slides.every(slide => typeof slide?.id === 'string' && typeof slide.title === 'string' && slide.title.length <= 160 && typeof slide.body === 'string' && slide.body.length <= 2400 && typeof slide.kicker === 'string' && slide.kicker.length <= 2400 && ['cover', 'content', 'closing', 'prompt'].includes(slide.kind))) return null;
      return { id: value.id, createdAt: typeof value.createdAt === 'string' ? value.createdAt.slice(0, 80) : '', request: snapshotCarouselRequest(value.request, value.request.revision), slides: value.slides.map(slide => ({ id: slide.id, title: slide.title, body: slide.body, kicker: slide.kicker, kind: slide.kind })) };
    };
    const result = restoreResult(saved.result);
    const results = Array.isArray(saved.results) ? saved.results.map(restoreResult).filter(Boolean).slice(0, 12) : [];
    return { draft, result, results, stage: result && saved.stage === 'result' ? 'result' : 'setup', setupStep: saved.setupStep === 2 ? 2 : 1, selected: result ? Math.max(0, Math.min(result.slides.length - 1, Number.isInteger(saved.selected) ? saved.selected : 0)) : 0 };
  } catch { return fallback; }
}

export function carouselFileName(result, index) {
  const title = result.request.topic.split(/\n/u)[0].replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/gu, '-').slice(0, 52) || 'карусель';
  return `${title}-${String(index + 1).padStart(2, '0')}.png`;
}
