import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  DRAWER_EDGE,
  drawerGestureIntent,
  drawerGestureVelocity,
  drawerProgressFromDrag,
  drawerProgressFromTransform,
  settleDrawerGesture,
} from './mobile-drawer-gesture.js';

const IGNORE_GESTURE = 'input, textarea, select, [contenteditable="true"], [role="slider"], [role="scrollbar"], [data-drawer-swipe-ignore]';

function hasHorizontalScroller(target, shell) {
  for (let node = target; node && node !== shell; node = node.parentElement) {
    if (node.scrollWidth > node.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(node).overflowX)) return true;
  }
  return false;
}

/**
 * Mobile push-navigation gestures. CSS owns the settled open/closed animation;
 * only a finger/mouse drag overrides --drawer-progress. Put shellRef on the
 * viewport shell, mainRef on its translated page, and data-mobile-drawer-panel
 * on the sidebar. [data-drawer-dragging] must disable their CSS transitions.
 * Native touch listeners preserve vertical scrolling until horizontal intent.
 */
export function useMobileDrawer({ enabled, open, onOpenChange }) {
  const shellRef = useRef(null);
  const mainRef = useRef(null);
  const latest = useRef({ open, onOpenChange });
  const cancelRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    latest.current = { open, onOpenChange };
    cancelRef.current?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!enabled || !shell) return;
    let gesture = null;
    let frame = 0;
    let releaseFrame = 0;
    let suppressClickUntil = 0;

    const readWidth = () => shell.querySelector('[data-mobile-drawer-panel]')?.getBoundingClientRect().width || Math.min(shell.clientWidth * 0.76, 336);
    const readProgress = width => drawerProgressFromTransform(getComputedStyle(mainRef.current || shell).transform, width, latest.current.open ? 1 : 0);
    const writeProgress = progress => shell.style.setProperty('--drawer-progress', String(progress));
    const flush = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (gesture?.started) writeProgress(gesture.progress);
    };
    const releaseCapture = active => {
      if (active?.pointerId != null && shell.hasPointerCapture(active.pointerId)) shell.releasePointerCapture(active.pointerId);
    };
    const clearVisual = () => {
      delete shell.dataset.drawerDragging;
      shell.style.removeProperty('--drawer-progress');
    };

    function finish(cancelled = false) {
      const active = gesture;
      if (!active) return;
      if (!active.started) {
        gesture = null;
        return;
      }
      flush();
      // Commit the last finger position before returning control to CSS. Its
      // transition can now continue from this position, even after a reversal.
      void mainRef.current?.offsetWidth;
      const nextOpen = settleDrawerGesture({
        progress: active.progress,
        velocity: drawerGestureVelocity(active.samples, performance.now()),
        distance: active.lastX - active.startX,
        wasOpen: active.wasOpen,
        cancelled,
      });
      gesture = null;
      releaseCapture(active);
      delete shell.dataset.drawerDragging;
      writeProgress(nextOpen ? 1 : 0);
      setDragging(false);
      suppressClickUntil = performance.now() + 400;
      if (nextOpen && !active.wasOpen) {
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && (focused.isContentEditable || focused.matches('input, textarea, select'))) focused.blur();
      }
      latest.current.onOpenChange(nextOpen);
      releaseFrame = requestAnimationFrame(() => {
        releaseFrame = 0;
        if (!gesture?.started) shell.style.removeProperty('--drawer-progress');
      });
    }

    function begin(target, x, y, pointerId = null, touchId = null) {
      if (gesture || !(target instanceof Element) || target.closest(IGNORE_GESTURE) || hasHorizontalScroller(target, shell)) return;
      const width = readWidth();
      const progress = readProgress(width);
      if (!latest.current.open && progress < 0.01 && x - shell.getBoundingClientRect().left > DRAWER_EDGE) return;
      gesture = {
        startX: x, startY: y, lastX: x, width, progress,
        startProgress: progress, wasOpen: latest.current.open,
        started: false, pointerId, touchId,
        samples: [{ x, time: performance.now() }],
      };
    }

    function move(x, y, event) {
      const active = gesture;
      if (!active) return;
      const dx = x - active.startX;
      const dy = y - active.startY;
      if (!active.started) {
        const intent = drawerGestureIntent(dx, dy, active.startProgress);
        if (intent === 'scroll' || intent === 'blocked') {
          gesture = null;
          return;
        }
        if (intent !== 'drag') return;
        // A click-triggered CSS transition may still be running when touched.
        // Read its live matrix at commitment rather than jumping to its target.
        active.startProgress = readProgress(active.width);
        active.started = true;
        cancelAnimationFrame(releaseFrame);
        shell.dataset.drawerDragging = 'true';
        active.progress = drawerProgressFromDrag(active.startProgress, dx, active.width);
        writeProgress(active.progress);
        if (active.pointerId != null) shell.setPointerCapture(active.pointerId);
        setDragging(true);
      }
      if (event.cancelable) event.preventDefault();
      active.lastX = x;
      active.progress = drawerProgressFromDrag(active.startProgress, dx, active.width);
      active.samples.push({ x, time: performance.now() });
      if (active.samples.length > 10) active.samples.shift();
      if (!frame) frame = requestAnimationFrame(flush);
    }

    const touchStart = event => {
      if (event.touches.length !== 1) {
        finish(true);
        return;
      }
      const touch = event.touches[0];
      begin(event.target, touch.clientX, touch.clientY, null, touch.identifier);
    };
    const touchMove = event => {
      if (!gesture || gesture.touchId == null) return;
      if (event.touches.length !== 1) return finish(true);
      const touch = [...event.touches].find(item => item.identifier === gesture.touchId);
      if (touch) move(touch.clientX, touch.clientY, event);
    };
    const touchEnd = event => {
      if (gesture?.touchId != null && [...event.changedTouches].some(item => item.identifier === gesture.touchId)) finish(event.type === 'touchcancel');
    };
    const pointerDown = event => {
      if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) return;
      begin(event.target, event.clientX, event.clientY, event.pointerId);
    };
    const pointerMove = event => {
      if (gesture?.pointerId === event.pointerId) move(event.clientX, event.clientY, event);
    };
    const pointerEnd = event => {
      if (gesture?.pointerId === event.pointerId) finish(event.type !== 'pointerup');
    };
    const suppressClick = event => {
      if (performance.now() < suppressClickUntil) {
        suppressClickUntil = 0;
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const cancel = () => finish(true);
    cancelRef.current = nextOpen => {
      if (gesture && gesture.wasOpen !== nextOpen) {
        const active = gesture;
        gesture = null;
        cancelAnimationFrame(frame);
        frame = 0;
        releaseCapture(active);
        clearVisual();
        setDragging(false);
      }
    };

    shell.addEventListener('touchstart', touchStart, { passive: true });
    shell.addEventListener('touchmove', touchMove, { passive: false });
    shell.addEventListener('touchend', touchEnd);
    shell.addEventListener('touchcancel', touchEnd);
    shell.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', pointerEnd);
    window.addEventListener('pointercancel', pointerEnd);
    shell.addEventListener('lostpointercapture', pointerEnd);
    shell.addEventListener('click', suppressClick, true);
    window.addEventListener('resize', cancel);
    window.addEventListener('blur', cancel);

    return () => {
      cancelRef.current = null;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(releaseFrame);
      const active = gesture;
      gesture = null;
      releaseCapture(active);
      clearVisual();
      shell.removeEventListener('touchstart', touchStart);
      shell.removeEventListener('touchmove', touchMove);
      shell.removeEventListener('touchend', touchEnd);
      shell.removeEventListener('touchcancel', touchEnd);
      shell.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerEnd);
      window.removeEventListener('pointercancel', pointerEnd);
      shell.removeEventListener('lostpointercapture', pointerEnd);
      shell.removeEventListener('click', suppressClick, true);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('blur', cancel);
      setDragging(false);
    };
  }, [enabled]);

  return { shellRef, mainRef, dragging };
}
