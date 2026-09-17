import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGenerationRequest, createDemoMedia, outputDimensions, durationSeconds, chatImageReferences, describeRequestOptions } from '../src/generation-request.js';

test('image request snapshots ratio, export resolution and requested result count', () => {
  const settings = { ratio: '9:16', quality: '2K', count: '3 шт' };
  const request = createGenerationRequest({ mode: 'image', settings, text: 'Портрет' });
  settings.ratio = '1:1';
  assert.equal(request.ratio, '9:16');
  assert.deepEqual({ width: request.width, height: request.height }, { width: 1152, height: 2048 });
  assert.equal(request.count, 3);
  const media = createDemoMedia(request, ['/a.png', '/b.png', '/c.png']);
  assert.deepEqual(media.variants.map(item => item.src), ['/a.png', '/b.png', '/c.png']);
  assert.ok(media.variants.every(item => item.ratio === '9:16'));
});
test('invalid options fall back and duration values become seconds', () => {
  const request = createGenerationRequest({ mode: 'video', settings: { ratio: '12:0', quality: 'garbage', duration: '20 с' } });
  assert.equal(request.ratio, '16:9');
  assert.equal(request.duration, 20);
  assert.deepEqual(outputDimensions('video', '9:16', '1080p'), { width: 1080, height: 1920 });
  assert.equal(durationSeconds('3 мин'), 180);
  assert.equal(durationSeconds('Авто'), null);
});
test('video reference tools pick the last image or all chat images and deduplicate attachments', () => {
  const messages = [{ id: 'a', media: { type: 'image', ready: true, src: '/a.png' } }, { id: 'b', media: { type: 'image', ready: true, src: '/b.png' } }];
  assert.equal(chatImageReferences(messages).length, 2);
  const last = createGenerationRequest({ mode: 'video', messages, settings: { lastImage: true } });
  assert.deepEqual(last.references.map(item => item.url), ['/b.png']);
  const all = createGenerationRequest({ mode: 'video', messages, settings: { chatImages: true }, refs: [{ url: '/a.png' }] });
  assert.deepEqual(all.references.map(item => item.url), ['/a.png', '/b.png']);
});
test('sound, research and voice options survive the request and are observable', () => {
  const audio = createGenerationRequest({ mode: 'audio', settings: { voice: 'Рома', language: 'Английский', backgroundMusic: true, duration: '1 мин' } });
  assert.equal(createDemoMedia(audio).voice, 'Рома');
  assert.equal(createDemoMedia(audio).duration, 60);
  assert.match(describeRequestOptions(audio), /с фоновой музыкой/);
  const text = createGenerationRequest({ mode: 'text', settings: { web: true, reasoning: true, role: 'Без роли' } });
  assert.equal(text.settings.role, '');
  assert.match(describeRequestOptions(text), /Поиск в сети включён/);
  assert.match(describeRequestOptions(text), /Исследование включено/);
});

test('persisted request removes transient blobs and raw File data', async () => {
  const { sanitizeGenerationRequest } = await import('../src/generation-request.js');
  const result = sanitizeGenerationRequest({ attachments: [{ id: 'a', raw: { secret: 'binary' }, url: 'blob:temporary', preview: 'blob:preview', name: 'photo.png' }], references: [{ id: 'b', url: '/result.png' }] });
  assert.deepEqual(result.attachments, [{ id: 'a', name: 'photo.png' }]);
  assert.deepEqual(result.references, [{ id: 'b', url: '/result.png' }]);
});
test('export crops match requested ratio without stretching', async () => {
  const { imageCrop } = await import('../src/media-download.js');
  assert.deepEqual(imageCrop(1600, 900, 900, 1600), { x: 546.875, y: 0, width: 506.25, height: 900 });
  assert.deepEqual(imageCrop(900, 1600, 1600, 900), { x: 0, y: 546.875, width: 900, height: 506.25 });
});


test('last image reference follows the latest result when demo URLs repeat', () => {
  const messages = [{id:'old',media:{type:'image',ready:true,src:'/a.png',variants:[{src:'/a.png'},{src:'/b.png'}]}},{id:'new',media:{type:'image',ready:true,src:'/a.png'}}];
  const request = createGenerationRequest({mode:'video',settings:{lastImage:true},messages});
  assert.equal(request.references[0].id,'new');
  assert.equal(request.references[0].url,'/a.png');
});
