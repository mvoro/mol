import test from 'node:test';
import assert from 'node:assert/strict';
import { CAROUSEL_FORMATS, CAROUSEL_STORAGE_KEY, DEFAULT_CAROUSEL_DRAFT, carouselFileName, carouselSlideCount, createCarouselResult, createCarouselVariant, divideCarouselText, readCarouselState, snapshotCarouselRequest, updateCarouselSlide, upsertCarouselResult, validateCarouselDraft } from '../src/carousel-model.js';
import { crc32, createCarouselZip } from '../src/carousel-export.js';

const draft = { ...DEFAULT_CAROUSEL_DRAFT, topic: 'Как находить идеи для контента', audience: 'Начинающие авторы' };

test('requires a brief and audience, and rejects invalid output dimensions/counts', () => {
  assert.deepEqual(Object.keys(validateCarouselDraft(DEFAULT_CAROUSEL_DRAFT)), ['topic', 'audience']);
  assert.deepEqual(validateCarouselDraft(draft), {});
  const invalid = validateCarouselDraft({ ...draft, count: 3.4, format: '16:9', template: 'missing' });
  assert.deepEqual(Object.keys(invalid).sort(), ['count', 'format', 'template']);
  assert.ok(validateCarouselDraft({ ...draft, topic: ' '.repeat(10) }).topic);
  assert.ok(validateCarouselDraft({ ...draft, topic: 'a'.repeat(2401) }).topic);
  assert.ok(validateCarouselDraft({ ...draft, audience: 'a'.repeat(161) }).audience);
});

test('generation snapshots parameters and produces exactly the requested slide count and format', () => {
  for (const count of [3, 5, 10]) {
    for (const format of CAROUSEL_FORMATS) {
      const input = { ...draft, count, format: format.value };
      const request = snapshotCarouselRequest(input);
      input.topic = 'A later draft'; input.count = 8;
      const result = createCarouselResult(request, { id: `test-${count}-${format.value}` });
      assert.equal(result.slides.length, count);
      assert.equal(result.request.format, format.value);
      assert.equal(result.request.topic, draft.topic);
      assert.equal(result.slides[0].title, draft.topic);
      assert.equal(new Set(result.slides.map(slide => slide.id)).size, count);
      assert.equal(result.slides[0].kicker, draft.audience);
    }
  }
});

test('long supplied copy is preserved fully in order instead of replaced with unrelated text', () => {
  const topic = Array.from({ length: 100 }, (_, index) => `Точный-текст-${index}`).join(' ');
  const result = createCarouselResult(snapshotCarouselRequest({ ...draft, count: 6, topic }));
  assert.equal(result.slides.filter(slide => slide.kind === 'content').map(slide => slide.body).join(' '), topic);
  assert.equal(divideCarouselText('Один\n\nдва три четыре пять', 3).join(' '), 'Один два три четыре пять');
  assert.ok(result.slides.every(slide => slide.title.length <= 112));
});

test('a standalone heading stays on the cover and adjacent complete paragraphs are grouped', () => {
  const heading = 'Как находить идеи для контента';
  const paragraphs = [
    'Сохраняйте вопросы аудитории. Они помогут выбрать тему будущего поста.',
    'Заведите заметку для идей. Возвращайтесь к ней каждую неделю.',
    'Смотрите на привычные вещи по-новому. Ищите конкретные примеры.',
    'Проверяйте идею в разговоре. Записывайте неожиданные ответы.',
  ];
  const result = createCarouselResult(snapshotCarouselRequest({ ...draft, count: 4, topic: `${heading}\n\n${paragraphs.join('\n\n')}` }));
  assert.equal(result.slides[0].title, heading);
  assert.equal(result.slides.length, 4);
  assert.deepEqual(result.slides.slice(1).flatMap(slide => slide.body.split('\n\n')), paragraphs);
  assert.ok(result.slides.slice(1).every(slide => !slide.body.includes(heading)));
  assert.ok(result.slides.every(slide => slide.title && typeof slide.body === 'string'));
});

test('sentence boundaries survive splitting and insufficient content never produces undefined slides', () => {
  const sentences = ['Первое предложение содержит исходную мысль.', 'Второе предложение объясняет её на примере.', 'Третье предложение добавляет деталь.', 'Четвёртое предложение завершает историю.'];
  const groups = divideCarouselText(sentences.join(' '), 3);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups.flatMap(group => group.split('\n\n')), sentences);
  const result = createCarouselResult(snapshotCarouselRequest({ ...draft, count: 10, topic: `Моя история\n\n${sentences[0]}` }));
  assert.equal(result.slides.length, 10);
  assert.ok(result.slides.every(slide => slide.title && typeof slide.body === 'string'));
  assert.ok(result.slides.slice(1).every(slide => slide.body.trim()));
  assert.equal(result.slides[1].body, sentences[0]);
});

test('maximum unpunctuated copy falls back to balanced word boundaries without losing text', () => {
  const topic = 'смысл '.repeat(400).trim();
  assert.equal(topic.length, 2399);
  for (const count of [3, 10]) {
    const result = createCarouselResult(snapshotCarouselRequest({ ...draft, topic, count, format: '1:1' }));
    const bodies = result.slides.slice(1).map(slide => slide.body);
    assert.equal(result.slides.length, count);
    assert.equal(bodies.join(' '), topic);
    assert.ok(bodies.every(body => body.trim() && body.length <= Math.ceil(topic.length / (count - 1)) + 12));
    assert.ok(result.slides.slice(1).every(slide => slide.kind === 'content'));
  }
});

test('Russian slide counts agree in the picker and preview', () => {
  assert.deepEqual([1, 3, 4, 5, 10, 11, 21, 24].map(carouselSlideCount), ['1 слайд', '3 слайда', '4 слайда', '5 слайдов', '10 слайдов', '11 слайдов', '21 слайд', '24 слайда']);
});

test('reload restores editable results, settings, selection and previous result history', () => {
  const result = createCarouselResult(snapshotCarouselRequest(draft), { id: 'saved' });
  result.slides[1].title = 'Моя правка';
  const storage = { getItem: key => { assert.equal(key, CAROUSEL_STORAGE_KEY); return JSON.stringify({ draft, result, results: [result], selected: 2, stage: 'result' }); } };
  const restored = readCarouselState(storage);
  assert.equal(restored.stage, 'result');
  assert.equal(restored.selected, 2);
  assert.equal(restored.result.slides[1].title, 'Моя правка');
  assert.equal(restored.results[0].id, 'saved');
  assert.deepEqual(restored.draft, draft);
});

test('legacy setup drafts preserve settings when restored into the shared setup screen', () => {
  for (const setupStep of [1, 2]) {
    const saved = { draft: { ...draft, template: 'botanical', count: 4, format: '9:16' }, stage: 'setup', setupStep };
    const restored = readCarouselState({ getItem: () => JSON.stringify(saved) });
    assert.equal(restored.setupStep, setupStep);
    assert.deepEqual(restored.draft, saved.draft);
  }
  assert.equal(readCarouselState({ getItem: () => JSON.stringify({ draft, setupStep: 7 }) }).setupStep, 1);
  assert.equal(readCarouselState({ getItem: () => null }).setupStep, 1);
});

test('edited carousel A survives creating B, reload and reopening the historical result', () => {
  const original = createCarouselResult(snapshotCarouselRequest(draft), { id: 'A' });
  let current = original;
  let results = upsertCarouselResult([], current);
  current = updateCarouselSlide(current, 0, 'title', 'Моя новая обложка');
  results = upsertCarouselResult(results, current);
  current = updateCarouselSlide(current, 1, 'body', 'Мой собственный текст слайда.');
  results = upsertCarouselResult(results, current);
  const variant = createCarouselVariant(current, { id: 'B' });
  results = upsertCarouselResult(results, variant);
  const saved = JSON.stringify({ draft, result: variant, results, stage: 'result' });
  const restored = readCarouselState({ getItem: () => saved });
  const reopened = restored.results.find(result => result.id === 'A');
  assert.equal(reopened.slides[0].title, 'Моя новая обложка');
  assert.equal(reopened.slides[1].body, 'Мой собственный текст слайда.');
  assert.equal(restored.result.id, 'B');
  assert.equal(restored.result.slides[0].title, reopened.slides[0].title);
  assert.equal(restored.result.slides[1].body, reopened.slides[1].body);
  assert.equal(variant.request.revision, original.request.revision + 1);
  assert.equal(variant.slides[0].id, 'B-0');
  assert.equal(original.slides[0].title, draft.topic);
  assert.notEqual(variant.slides[0], current.slides[0]);
  assert.equal(new Set(restored.results.map(result => result.id)).size, restored.results.length);
});

test('ordinary generation still creates fresh copy from changed settings', () => {
  const original = createCarouselResult(snapshotCarouselRequest(draft), { id: 'A' });
  const edited = updateCarouselSlide(original, 0, 'title', 'Ручная правка');
  const fresh = createCarouselResult(snapshotCarouselRequest({ ...draft, topic: 'Другая история', count: 3, format: '9:16' }), { id: 'new' });
  const archive = upsertCarouselResult(upsertCarouselResult([], edited), fresh);
  assert.equal(fresh.slides[0].title, 'Другая история');
  assert.equal(fresh.slides.length, 3);
  assert.equal(fresh.request.format, '9:16');
  assert.equal(fresh.request.revision, 0);
  assert.equal(archive.find(result => result.id === 'A').slides[0].title, 'Ручная правка');
});

test('malformed persistence cannot crash the screen or restore invalid results', () => {
  for (const value of ['broken JSON', 'null', '[]', JSON.stringify({ result: { id: 'bad', slides: [] }, draft: { count: 999, format: 'unknown', topic: 42 }, selected: -42, stage: 'result' })]) {
    const state = readCarouselState({ getItem: () => value });
    assert.equal(state.result, null);
    assert.equal(state.stage, 'setup');
    assert.equal(state.draft.count, 5);
  }
  assert.equal(readCarouselState({ getItem: () => { throw new Error('Blocked'); } }).result, null);
});

test('ZIP export includes lossless file contents, Unicode names, CRC and valid directory offsets', async () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const files = [{ name: 'слайд-01.png', data: new Uint8Array([0, 1, 2, 255]) }, { name: 'слайд-02.png', data: new Blob(['actual PNG bytes']) }];
  const zip = await createCarouselZip(files);
  assert.equal(zip.type, 'application/zip');
  const bytes = new Uint8Array(await zip.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const end = bytes.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  assert.equal(view.getUint16(end + 10, true), files.length);
  let localOffset = 0;
  let directoryOffset = view.getUint32(end + 16, true);
  for (const file of files) {
    const expected = file.data instanceof Uint8Array ? file.data : new Uint8Array(await file.data.arrayBuffer());
    assert.equal(view.getUint32(localOffset, true), 0x04034b50);
    assert.equal(view.getUint16(localOffset + 6, true), 0x0800);
    const nameLength = view.getUint16(localOffset + 26, true);
    assert.equal(new TextDecoder().decode(bytes.slice(localOffset + 30, localOffset + 30 + nameLength)), file.name);
    const dataStart = localOffset + 30 + nameLength;
    assert.deepEqual(bytes.slice(dataStart, dataStart + expected.length), expected);
    assert.equal(view.getUint32(localOffset + 14, true), crc32(expected));
    assert.equal(view.getUint32(directoryOffset, true), 0x02014b50);
    assert.equal(view.getUint32(directoryOffset + 42, true), localOffset);
    directoryOffset += 46 + nameLength;
    localOffset = dataStart + expected.length;
  }
  assert.equal(directoryOffset, end);
  assert.equal(localOffset, view.getUint32(end + 16, true));
});

test('export names retain meaningful Cyrillic copy and strip filesystem separators', () => {
  const result = createCarouselResult(snapshotCarouselRequest({ ...draft, topic: 'Привет / мир: история?' }));
  assert.equal(carouselFileName(result, 2), 'Привет-мир-история-03.png');
});
