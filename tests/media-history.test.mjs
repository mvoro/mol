import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectReadyMedia } from '../src/media-history.js';

const result = (id, type, ready = true) => ({ id, media: { type, ready, src: `/demo.${type}`, title: id } });
test('one result appears once, with the current completed state', () => {
  const current = result('a', 'video');
  assert.deepEqual(collectReadyMedia([{ messages: [result('a', 'video', false)] }], [current]), [{ ...current.media, id: 'a' }]);
});
test('pending and stopped results cannot open as completed media', () => {
  assert.deepEqual(collectReadyMedia([{ messages: [result('a', 'image')] }], [result('a', 'image', false)]), []);
});
test('library includes legacy images and all three media types across chats', () => {
  const items = collectReadyMedia([{ messages: [result('a', 'audio'), { id: 'old', preview: '/old.jpg', model: 'Demo' }] }], [result('v', 'video'), result('i', 'image')]);
  assert.deepEqual(items.map(item => item.id), ['i', 'v', 'old', 'a']);
  assert.deepEqual(items.map(item => item.type), ['image', 'video', 'image', 'audio']);
});

test('all generated image variants enter viewer and library with stable ids', () => {
  const message = { id: 'batch', media: { type: 'image', src: '/a.png', ready: true, variants: [{ type: 'image', src: '/a.png', ready: false }, { type: 'image', src: '/b.png', ready: false }] } };
  const items = collectReadyMedia([], [message]);
  assert.deepEqual(items.map(item => item.id), ['batch', 'batch-1']);
  assert.ok(items.every(item => item.ready));
});
