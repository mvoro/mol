import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawerGestureIntent,
  drawerGestureVelocity,
  drawerProgressFromDrag,
  drawerProgressFromTransform,
  settleDrawerGesture,
} from '../src/hooks/mobile-drawer-gesture.js';

test('drawer waits for horizontal intent and leaves vertical scrolling alone', () => {
  assert.equal(drawerGestureIntent(7, 2), 'pending');
  assert.equal(drawerGestureIntent(12, 12), 'pending');
  assert.equal(drawerGestureIntent(5, 20), 'scroll');
  assert.equal(drawerGestureIntent(20, 5), 'drag');
  assert.equal(drawerGestureIntent(-20, 5, 0), 'blocked');
  assert.equal(drawerGestureIntent(20, 5, 1), 'blocked');
  assert.equal(drawerGestureIntent(-20, 5, 1), 'drag');
});

test('drawer drag clamps at each edge and preserves its interrupted position', () => {
  assert.equal(drawerProgressFromDrag(0.4, 30, 300), 0.5);
  assert.equal(drawerProgressFromDrag(0.4, -300, 300), 0);
  assert.equal(drawerProgressFromDrag(0.4, 300, 300), 1);
  assert.equal(drawerProgressFromDrag(0.4, 20, 0), 0.4);
  assert.equal(drawerProgressFromTransform('matrix(1, 0, 0, 1, 120, 0)', 300), 0.4);
  assert.equal(drawerProgressFromTransform('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 225, 0, 0, 1)', 300), 0.75);
  assert.equal(drawerProgressFromTransform('none', 300, 1), 1);
});

test('a short deliberate flick commits in either direction; a slow drag uses midpoint', () => {
  assert.equal(settleDrawerGesture({ progress: 0.15, velocity: 0.6, distance: 45 }), true);
  assert.equal(settleDrawerGesture({ progress: 0.85, velocity: -0.6, distance: -45, wasOpen: true }), false);
  assert.equal(settleDrawerGesture({ progress: 0.15, velocity: 0.6, distance: 4 }), false);
  assert.equal(settleDrawerGesture({ progress: 0.49, velocity: 0.05, distance: 140 }), false);
  assert.equal(settleDrawerGesture({ progress: 0.51, velocity: -0.05, distance: -140, wasOpen: true }), true);
});

test('velocity uses recent direction and expires after pausing', () => {
  const samples = [{ x: 0, time: 0 }, { x: 100, time: 100 }, { x: 90, time: 160 }, { x: 60, time: 200 }];
  assert.equal(drawerGestureVelocity(samples, 210), -0.4);
  assert.equal(drawerGestureVelocity(samples, 290), 0);
  assert.equal(drawerGestureVelocity([{ x: 10, time: 0 }], 10), 0);
});

test('cancelled swipes restore the state that existed before the gesture', () => {
  assert.equal(settleDrawerGesture({ progress: 0.9, velocity: 1, distance: 250, cancelled: true }), false);
  assert.equal(settleDrawerGesture({ progress: 0.1, velocity: -1, distance: -250, wasOpen: true, cancelled: true }), true);
});
