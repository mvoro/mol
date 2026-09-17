import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoleReview, saveRoleReview, REVIEW_MAX_LENGTH } from '../src/components/role-feedback.js';

test('feedback accepts selected aspects without requiring text and rejects empty submissions', () => {
  assert.equal(createRoleReview({ text: '  ', aspects: [] }), null);
  const review = createRoleReview({ aspects: ['Точные ответы', 'Точные ответы', 'unknown'] });
  assert.equal(review.text, '');
  assert.deepEqual(review.aspects, ['Точные ответы']);
});

test('review text respects the 500-character limit even outside the textarea', () => {
  const review = createRoleReview({ text: '  ' + 'а'.repeat(700) + '  ' });
  assert.equal(review.text.length, REVIEW_MAX_LENGTH);
  assert.equal(review.name, 'Вы');
});

test('editing a local review replaces it without changing reviews for other roles', () => {
  const original = { prompt: [{ name: 'Вы', text: 'old' }, { name: 'Марина', text: 'another' }], copywriter: [{ name: 'Вы', text: 'other role' }] };
  const review = createRoleReview({ text: ' Новый отзыв ' });
  const next = saveRoleReview(original, 'prompt', review);
  assert.equal(next.prompt.length, 2);
  assert.equal(next.prompt[0].text, 'Новый отзыв');
  assert.equal(next.prompt[1].name, 'Марина');
  assert.deepEqual(next.copywriter, original.copywriter);
  assert.equal(original.prompt[0].text, 'old');
});
