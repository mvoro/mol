import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CAROUSEL_TEMPLATES } from '../src/carousel-model.js';

test('the 20 ready styles have distinct, valid local portrait PNG backgrounds', async () => {
  assert.equal(CAROUSEL_TEMPLATES.length, 20);
  assert.equal(new Set(CAROUSEL_TEMPLATES.map(style => style.id)).size, 20);
  assert.equal(new Set(CAROUSEL_TEMPLATES.map(style => style.image)).size, 20);
  await Promise.all(CAROUSEL_TEMPLATES.map(async style => {
    const png = await readFile(new URL(`../public${style.image}`, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], style.id);
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    assert.ok(width >= 1000 && height > width, `${style.id}: usable portrait resolution`);
  }));
});
