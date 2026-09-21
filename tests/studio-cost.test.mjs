import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateCarouselCost, estimateTrendCost, estimateGenerationCost, formatGenerationCost } from '../src/generation-cost.js';

test('carousel quote uses the shared image rate for every requested slide beyond the composer four-image limit', () => {
  const rate = estimateGenerationCost('image', { quality: '1K', count: '1 шт' });
  assert.equal(estimateCarouselCost({ count: 3 }), 3 * rate);
  assert.equal(estimateCarouselCost({ count: '5' }), 5 * rate);
  assert.equal(estimateCarouselCost({ count: 10 }), 10 * rate);
  assert.equal(estimateCarouselCost({ count: 50 }), 10 * rate);
  assert.equal(estimateCarouselCost({ count: NaN }), 5 * rate);
});

test('trend quote tracks quality using the same no-audio video rates as the composer', () => {
  assert.equal(estimateTrendCost({ quality: '720' }), estimateGenerationCost('video', { quality: '720p', sound: false }));
  assert.equal(estimateTrendCost({ quality: '1080' }), estimateGenerationCost('video', { quality: '1080p', sound: false }));
  assert.ok(estimateTrendCost({ quality: '1080' }) > estimateTrendCost({ quality: '720' }));
  assert.equal(estimateTrendCost({ quality: 'invalid' }), estimateTrendCost());
});

test('studio cost labels use readable Russian number grouping', () => {
  assert.equal(formatGenerationCost(1250).replace(/\s/gu, ' '), '1 250');
  assert.equal(formatGenerationCost(12.5), '12,5');
});
