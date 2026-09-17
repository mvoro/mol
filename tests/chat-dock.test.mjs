import test from 'node:test';
import assert from 'node:assert/strict';
import { getComposerDockPadding } from '../src/components/useChatAutoScroll.js';

test('chat clearance includes composer, bottom gap, and a visible message gap', () => {
  assert.equal(getComposerDockPadding(844, 616), 252);
});

test('audio dock and growing attachments increase the measured clearance', () => {
  assert.equal(getComposerDockPadding(844, 464), 404);
  assert.equal(getComposerDockPadding(844, 384), 484);
});

test('viewport offsets cancel out and fractional pixels round up', () => {
  assert.equal(getComposerDockPadding(886, 658), 252);
  assert.equal(getComposerDockPadding(844, 616.5), 252);
  assert.equal(getComposerDockPadding(400, 420), 24);
});
