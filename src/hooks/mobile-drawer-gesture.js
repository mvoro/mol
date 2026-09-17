export const DRAWER_EDGE = 24;
export const DRAWER_AXIS_THRESHOLD = 8;

export function clampDrawerProgress(progress) {
  return Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
}

/** Wait for a clear axis, then leave vertical scrolling entirely to the browser. */
export function drawerGestureIntent(deltaX, deltaY, progress = 0) {
  const x = Math.abs(deltaX);
  const y = Math.abs(deltaY);
  if (Math.max(x, y) < DRAWER_AXIS_THRESHOLD) return 'pending';
  if (y > x * 1.15) return 'scroll';
  if (x <= y * 1.15) return 'pending';
  if ((progress <= 0 && deltaX < 0) || (progress >= 1 && deltaX > 0)) return 'blocked';
  return 'drag';
}

export function drawerProgressFromDrag(startProgress, deltaX, width) {
  if (!(width > 0)) return clampDrawerProgress(startProgress);
  return clampDrawerProgress(startProgress + deltaX / width);
}

/** Recent velocity only: a flick followed by a pause must not commit the drawer. */
export function drawerGestureVelocity(samples, now) {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (now - last.time > 80) return 0;
  const boundary = last.time - 100;
  let first = samples[0];
  for (const sample of samples) {
    if (sample.time > boundary) break;
    first = sample;
  }
  const elapsed = last.time - first.time;
  return elapsed > 0 ? (last.x - first.x) / elapsed : 0;
}

export function settleDrawerGesture({ progress, velocity = 0, distance = 0, wasOpen = false, cancelled = false }) {
  if (cancelled) return wasOpen;
  // Avoid treating a tiny accidental twitch as a flick. Otherwise the latest
  // direction wins, including a deliberate reversal near the end of the swipe.
  if (Math.abs(distance) >= 16 && Math.abs(velocity) >= 0.35) return velocity > 0;
  return clampDrawerProgress(progress) >= 0.5;
}

export function drawerProgressFromTransform(transform, width, fallback = 0) {
  if (!(width > 0) || !transform || transform === 'none') return clampDrawerProgress(fallback);
  const match = transform.match(/^matrix(3d)?\(([^)]+)\)$/);
  if (!match) return clampDrawerProgress(fallback);
  const values = match[2].split(',').map(Number);
  const translation = values[match[1] ? 12 : 4];
  return Number.isFinite(translation) ? clampDrawerProgress(translation / width) : clampDrawerProgress(fallback);
}
