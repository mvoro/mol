import test from 'node:test';
import assert from 'node:assert/strict';
import { getMobileViewport } from '../src/components/useMobileViewport.js';

test('mobile viewport follows visible browser chrome without claiming a keyboard', () => {
  assert.deepEqual(getMobileViewport({ layoutHeight: 844, visualHeight: 760 }), { height: 760, top: 0, keyboard: false });
});

test('mobile keyboard reduces the available height and preserves the visual pan offset', () => {
  assert.deepEqual(getMobileViewport({ layoutHeight: 844, visualHeight: 460, visualTop: 42, editable: true }), { height: 460, top: 42, keyboard: true });
  assert.equal(getMobileViewport({ layoutHeight: 460, visualHeight: 460, baselineHeight: 844, editable: true }).keyboard, true);
});

test('keyboard remains tracked during blur animation and clears when it is dismissed', () => {
  assert.equal(getMobileViewport({ layoutHeight: 844, visualHeight: 560, keyboardWasOpen: true }).keyboard, true);
  assert.equal(getMobileViewport({ layoutHeight: 844, visualHeight: 844, keyboardWasOpen: true }).keyboard, false);
});

test('pinch zoom never changes the mobile layout size', () => {
  assert.equal(getMobileViewport({ layoutHeight: 844, visualHeight: 422, scale: 2, editable: true }), null);
  assert.equal(getMobileViewport({ layoutHeight: 844, visualHeight: 0 }), null);
});
