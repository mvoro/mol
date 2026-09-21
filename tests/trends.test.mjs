import test from 'node:test';
import assert from 'node:assert/strict';
import { TREND_TEMPLATES, MAX_CHARACTER_BYTES, validateCharacter, validateTrendDraft, trendTransform } from '../src/trends-engine.js';

test('character upload rejects unsupported, empty and oversized files', () => {
  assert.match(validateCharacter({ type: 'video/mp4', size: 100 }), /JPG/);
  assert.match(validateCharacter({ type: 'image/svg+xml', size: 100 }), /JPG/);
  assert.match(validateCharacter({ type: 'image/png', size: 0 }), /пуст/);
  assert.match(validateCharacter({ type: 'image/png', size: MAX_CHARACTER_BYTES + 1 }), /15 МБ/);
  assert.equal(validateCharacter({ type: 'image/webp', size: MAX_CHARACTER_BYTES }), '');
});
test('generation validates inputs rather than choosing a template or photo silently', () => {
  const valid = { templateId: 'close-up', character: { blob: new Blob(['photo']) }, quality: '720', caption: 'Привет' };
  assert.equal(validateTrendDraft(valid), '');
  assert.match(validateTrendDraft({ ...valid, templateId: '' }), /движение/);
  assert.match(validateTrendDraft({ ...valid, templateId: 'deleted-template' }), /движение/);
  assert.match(validateTrendDraft({ ...valid, character: null }), /фото/);
  assert.match(validateTrendDraft({ ...valid, quality: '4k' }), /качество/);
  assert.match(validateTrendDraft({ ...valid, caption: 'а'.repeat(161) }), /160/);
});
test('all eight presets animate without exposing canvas edges at 9:16', () => {
  assert.equal(new Set(TREND_TEMPLATES.map(t => t.id)).size, 8);
  for (const template of TREND_TEMPLATES) {
    const transforms = [];
    for (let step = 0; step <= 60; step++) {
      const frame = trendTransform(template.motion, step / 60);
      transforms.push(JSON.stringify(frame));
      const halfWidth = .5, halfHeight = 8 / 9;
      const cos = Math.cos(-frame.rotation), sin = Math.sin(-frame.rotation);
      // Transform all target-frame corners into scaled source coordinates.
      for (const dx of [-halfWidth, halfWidth]) for (const dy of [-halfHeight, halfHeight]) {
        const x = dx - frame.x, y = dy - frame.y * 16 / 9;
        assert.ok(Math.abs(x * cos - y * sin) <= halfWidth * frame.scale, `${template.id} exposes horizontal edge`);
        assert.ok(Math.abs(x * sin + y * cos) <= halfHeight * frame.scale, `${template.id} exposes vertical edge`);
      }
    }
    assert.ok(new Set(transforms).size > 20, `${template.id} must visibly move`);
  }
});
test('camera transform clamps time and keeps deterministic endpoints', () => {
  assert.deepEqual(trendTransform('zoom-in', -1), trendTransform('zoom-in', 0));
  assert.deepEqual(trendTransform('zoom-in', 2), trendTransform('zoom-in', 1));
  assert.ok(trendTransform('zoom-in', 1).scale > trendTransform('zoom-in', 0).scale);
  assert.ok(trendTransform('zoom-out', 1).scale < trendTransform('zoom-out', 0).scale);
});
