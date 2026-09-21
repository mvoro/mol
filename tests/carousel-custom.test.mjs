import test from 'node:test';
import assert from 'node:assert/strict';
import { CAROUSEL_TEMPLATES, DEFAULT_CAROUSEL_DRAFT, createCarouselResult, createCarouselVariant, readCarouselState, resolveCarouselStyle, snapshotCarouselRequest, validateCarouselDraft } from '../src/carousel-model.js';
import { MAX_CAROUSEL_REFERENCE_BYTES, normalizeCarouselReference, readCarouselReference, saveCarouselReference, validateCarouselReferenceFiles } from '../src/carousel-references.js';
import { renderCarousel } from '../src/carousel-export.js';

const reference = { id: '987a66c0-46f3-4739-a052-cbb4c120afe2', name: 'Референс.png', type: 'image/png', size: 1048, width: 1280, height: 1920 };
const custom = { ...DEFAULT_CAROUSEL_DRAFT, template: 'custom', topic: 'Моя история', audience: 'Авторы', styleDescription: 'Тёплый бежевый фон, редакционная типографика', references: [], count: 3 };

test('custom style needs a description but accepts zero optional references', () => {
  assert.deepEqual(validateCarouselDraft(custom), {});
  for (const styleDescription of ['', '  ', 'xy', 'x'.repeat(1201)]) assert.ok(validateCarouselDraft({ ...custom, styleDescription }).styleDescription);
  assert.ok(CAROUSEL_TEMPLATES.every(template => template.id !== 'custom'));
  assert.ok(validateCarouselDraft({ ...custom, references: Array.from({ length: 6 }, () => ({ ...reference })) }).references);
  assert.ok(validateCarouselDraft({ ...custom, references: [reference, reference] }).references);
  assert.ok(validateCarouselDraft({ ...custom, references: [{ ...reference, id: '../../photo.png' }] }).references);
  assert.equal(normalizeCarouselReference({ ...reference, width: 120 }), null);
  assert.equal(normalizeCarouselReference({ ...reference, width: 12000, height: 12000 }), null);
});

test('custom snapshots and variants copy reference metadata deeply and ignore arbitrary source URLs', () => {
  const source = { ...custom, references: [{ ...reference, url: 'https://untrusted.example/photo', unknown: true }] };
  const request = snapshotCarouselRequest(source);
  source.references[0].name = 'Поздняя правка.png'; source.references.push({ ...reference });
  assert.equal(request.references.length, 1);
  assert.equal(request.references[0].name, reference.name);
  assert.deepEqual(Object.keys(request.references[0]), Object.keys(reference));
  assert.ok(Object.isFrozen(request.references) && Object.isFrozen(request.references[0]));
  const original = createCarouselResult(request, { id: 'A' });
  const variant = createCarouselVariant(original, { id: 'B' });
  assert.notEqual(variant.request.references, original.request.references);
  assert.notEqual(variant.request.references[0], original.request.references[0]);
  assert.deepEqual(variant.request.references, original.request.references);
  assert.equal(variant.request.styleDescription, custom.styleDescription);
});

test('reload preserves custom result history and sanitizes malformed draft attachments', () => {
  const result = createCarouselResult(snapshotCarouselRequest({ ...custom, references: [reference] }), { id: 'custom-result' });
  const persisted = JSON.parse(JSON.stringify({ draft: custom, result, results: [result], stage: 'result', selected: 1 }));
  persisted.draft.references = [null, { ...reference, id: '../no.png' }, { ...reference, extra: 'drop-me' }, reference, { ...reference, type: 'image/svg+xml' }];
  persisted.result.request.externalImage = 'javascript:alert(1)';
  persisted.result.slides[0].unexpected = true;
  const restored = readCarouselState({ getItem: () => JSON.stringify(persisted) });
  assert.equal(restored.draft.template, 'custom');
  assert.deepEqual(restored.draft.references, [reference]);
  assert.equal(restored.stage, 'result');
  assert.equal(restored.selected, 1);
  assert.equal(restored.result.request.styleDescription, custom.styleDescription);
  assert.deepEqual(restored.result.request.references, [reference]);
  assert.equal('externalImage' in restored.result.request, false);
  assert.equal('unexpected' in restored.result.slides[0], false);
  assert.equal(restored.results[0].id, result.id);
  persisted.result.request.references[0].id = 'https://remote.example/image.png';
  assert.equal(readCarouselState({ getItem: () => JSON.stringify(persisted) }).result, null);
});

test('legacy built-in requests remain valid without newly added style fields', () => {
  const { styleDescription, references, ...legacy } = { ...custom, template: 'editorial' };
  const result = createCarouselResult(snapshotCarouselRequest(legacy));
  const state = readCarouselState({ getItem: () => JSON.stringify({ draft: legacy, result, stage: 'result' }) });
  assert.equal(state.result.request.template, 'editorial');
  assert.deepEqual(state.result.request.references, []);
  assert.equal(state.draft.styleDescription, '');
});

test('description controls a restrained palette and typography without substituting a built-in artwork', () => {
  const warm = resolveCarouselStyle(custom);
  assert.equal(warm.name, 'Свой стиль');
  assert.equal(warm.image, null);
  assert.equal(warm.font, 'Georgia');
  const blue = resolveCarouselStyle({ ...custom, styleDescription: 'Холодный синий фон, без засечек' });
  assert.notEqual(blue.background, warm.background);
  assert.equal(blue.font, 'Manrope Variable');
  const explicit = resolveCarouselStyle({ ...custom, styleDescription: 'Фон #123, текст #fff' });
  assert.equal(explicit.background, '#112233');
  assert.equal(explicit.ink, '#ffffff');
  const unreadable = resolveCarouselStyle({ ...custom, styleDescription: 'Фон #fff, текст #fff' });
  assert.equal(unreadable.ink, '#202024');
  assert.equal(resolveCarouselStyle({ template: 'editorial' }), CAROUSEL_TEMPLATES[0]);
  assert.equal(resolveCarouselStyle({ template: '../../remote-image' }), null);
});

test('attachment batches reject excessive counts, invalid types, empty and oversized files atomically', () => {
  const valid = { type: 'image/png', size: 1024 };
  assert.equal(validateCarouselReferenceFiles([valid, valid], 3), '');
  assert.ok(validateCarouselReferenceFiles([valid, valid], 4));
  assert.ok(validateCarouselReferenceFiles([valid, { type: 'image/svg+xml', size: 1024 }], 0));
  assert.ok(validateCarouselReferenceFiles([{ ...valid, size: 0 }]));
  assert.equal(validateCarouselReferenceFiles([{ ...valid, size: MAX_CAROUSEL_REFERENCE_BYTES }]), '');
  assert.ok(validateCarouselReferenceFiles([{ ...valid, size: MAX_CAROUSEL_REFERENCE_BYTES + 1 }]));
});

function replaceGlobal(name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  return () => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name];
}

function mockIndexedDB() {
  const photos = new Map();
  let closed = 0;
  const restore = replaceGlobal('indexedDB', {
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = {
          close() { closed += 1; },
          transaction() {
            const transaction = {};
            const operation = task => {
              const operationRequest = {};
              queueMicrotask(() => { operationRequest.result = task(); transaction.oncomplete?.(); });
              return operationRequest;
            };
            transaction.objectStore = () => ({ put: (blob, key) => operation(() => photos.set(key, blob)), get: key => operation(() => photos.get(key)) });
            return transaction;
          },
        };
        request.onsuccess();
      });
      return request;
    },
  });
  return { restore, photos, closed: () => closed };
}

test('photo storage keeps blobs outside serializable metadata, survives repeated reads, and rejects undecodable files', async () => {
  const store = mockIndexedDB();
  let decodedClosed = 0;
  const restoreDecoder = replaceGlobal('createImageBitmap', async () => ({ width: 1280, height: 1920, close() { decodedClosed += 1; } }));
  try {
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], 'Мой референс.png', { type: 'image/png' });
    const metadata = await saveCarouselReference(file);
    assert.deepEqual(normalizeCarouselReference(metadata), metadata);
    assert.equal('blob' in metadata, false);
    assert.equal('url' in metadata, false);
    assert.equal((await readCarouselReference(metadata.id)).size, file.size);
    assert.equal((await readCarouselReference(metadata.id)).type, file.type);
    assert.equal(await readCarouselReference('../photo.png'), null);
    assert.equal(store.closed(), 3);
    assert.equal(decodedClosed, 1);
    await assert.rejects(saveCarouselReference(new File(['<svg></svg>'], 'pretend.png', { type: 'image/png' })), /Не удалось прочитать фото/u);
    assert.equal(store.photos.size, 1);
  } finally { restoreDecoder(); store.restore(); }
});

test('custom exports use an empty background without photos, rotate uploaded photos, and fail on missing references', async () => {
  const store = mockIndexedDB();
  const drawn = [];
  const urls = new Map();
  const revoked = [];
  let urlIndex = 0;
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = blob => { const url = `blob:carousel-test-${++urlIndex}`; urls.set(url, blob); return url; };
  URL.revokeObjectURL = url => revoked.push(url);
  const context = { fillRect() {}, save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {}, measureText: text => ({ width: text.length * 10 }), createLinearGradient: () => ({ addColorStop() {} }), drawImage: picture => drawn.push(urls.get(picture.src)) };
  const restoreDocument = replaceGlobal('document', { fonts: { ready: Promise.resolve() }, createElement: () => ({ getContext: () => context, toBlob: callback => callback(new Blob(['PNG'], { type: 'image/png' })) }) });
  const restoreImage = replaceGlobal('Image', class { naturalWidth = 1280; naturalHeight = 1920; set src(value) { this.url = value; queueMicrotask(() => this.onload()); } get src() { return this.url; } });
  try {
    const clean = createCarouselResult(snapshotCarouselRequest(custom));
    assert.equal((await renderCarousel(clean)).length, 3);
    assert.equal(drawn.length, 0);
    const second = { ...reference, id: '244c6e34-4453-494d-a8cd-3e69f12218b0', name: 'Второй.png' };
    const firstBlob = new Blob(['first']), secondBlob = new Blob(['second']);
    store.photos.set(reference.id, firstBlob); store.photos.set(second.id, secondBlob);
    const withPhotos = createCarouselResult(snapshotCarouselRequest({ ...custom, references: [reference, second] }));
    await renderCarousel(withPhotos);
    assert.deepEqual(drawn, [firstBlob, secondBlob, firstBlob]);
    assert.equal(revoked.length, 2);
    assert.equal(urlIndex, 2);
    const missing = { ...reference, id: 'b1c805ee-ccbd-4446-af8c-39f5f9e5aa44', name: 'Удалённый.png' };
    await assert.rejects(renderCarousel(createCarouselResult(snapshotCarouselRequest({ ...custom, references: [missing] }))), /Удалённый.png.*недоступно/u);
  } finally { restoreImage(); restoreDocument(); store.restore(); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; }
});
