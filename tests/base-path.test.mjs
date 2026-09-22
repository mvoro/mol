import test from 'node:test';
import assert from 'node:assert/strict';
import { withBasePath, withoutBasePath } from '../src/base-path.js';

test('public documents and shared conversation links stay inside the Pages site', () => {
  assert.equal(withBasePath('/documents/garden.pdf', '/mol/'), '/mol/documents/garden.pdf');
  assert.equal(withBasePath('/?chat=demo', '/mol/'), '/mol/?chat=demo');
  assert.equal(withBasePath('/mol/media/cover.png', '/mol/'), '/mol/media/cover.png');
  assert.equal(withBasePath('/media/cover.png', '/'), '/media/cover.png');
});

test('uploaded files and external media are never rewritten', () => {
  for (const url of ['blob:https://example.com/file', 'data:image/png;base64,abc', 'https://example.com/video.mp4', '//example.com/a.png', 'relative.png', null]) {
    assert.equal(withBasePath(url, '/mol/'), url);
  }
});

test('route normalization only strips the exact deployment prefix', () => {
  assert.equal(withoutBasePath('/mol/carousel/', '/mol/'), '/carousel/');
  assert.equal(withoutBasePath('/mol', '/mol/'), '/');
  assert.equal(withoutBasePath('/mol/', '/mol/'), '/');
  assert.equal(withoutBasePath('/molecule/carousel', '/mol/'), '/molecule/carousel');
});
