import { useEffect } from 'react';

// Browser chrome and the on-screen keyboard resize the visual viewport on iOS.
// Pinch zoom also does, but must never resize the application layout.
export function getMobileViewport({ layoutHeight, visualHeight = layoutHeight, visualTop = 0, scale = 1, baselineHeight = layoutHeight, editable = false, keyboardWasOpen = false }) {
  if (Math.abs(scale - 1) > 0.02 || visualHeight <= 0) return null;
  const height = Math.round(visualHeight);
  const keyboard = (editable || keyboardWasOpen) && Math.max(layoutHeight, baselineHeight) - height > 120;
  return { height, top: Math.max(0, Math.round(visualTop)), keyboard };
}

function isEditing(element) {
  if (!element || element.disabled || element.readOnly) return false;
  return element.isContentEditable || element.matches('textarea, input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]):not([type="hidden"])');
}

export function useMobileViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(max-width: 700px)');
    const viewport = window.visualViewport;
    let frame = 0;
    let baselineHeight = window.innerHeight;
    let keyboardWasOpen = false;
    const clear = () => {
      root.style.removeProperty('--mobile-viewport-height');
      root.style.removeProperty('--mobile-viewport-top');
      delete root.dataset.mobileKeyboard;
    };
    const measure = () => {
      frame = 0;
      if (!media.matches) { clear(); return; }
      const editable = isEditing(document.activeElement);
      const next = getMobileViewport({
        layoutHeight: window.innerHeight,
        visualHeight: viewport?.height,
        visualTop: viewport?.offsetTop,
        scale: viewport?.scale,
        baselineHeight,
        editable,
        keyboardWasOpen,
      });
      if (!next) return;
      if (!next.keyboard && !editable) baselineHeight = window.innerHeight;
      keyboardWasOpen = next.keyboard;
      const height = `${next.height}px`;
      const top = `${next.top}px`;
      if (root.style.getPropertyValue('--mobile-viewport-height') !== height) root.style.setProperty('--mobile-viewport-height', height);
      if (root.style.getPropertyValue('--mobile-viewport-top') !== top) root.style.setProperty('--mobile-viewport-top', top);
      if (next.keyboard) root.dataset.mobileKeyboard = 'true';
      else delete root.dataset.mobileKeyboard;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const orientation = () => { baselineHeight = window.innerHeight; keyboardWasOpen = false; schedule(); };
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', orientation);
    media.addEventListener('change', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', orientation);
      media.removeEventListener('change', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      clear();
    };
  }, []);
}
