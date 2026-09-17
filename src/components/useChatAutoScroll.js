import { useLayoutEffect, useRef } from 'react';

export function getComposerDockPadding(scrollBottom, dockTop, gap = 24) {
  return Math.max(0, Math.ceil(scrollBottom - dockTop)) + gap;
}

// Follow new output until the reader deliberately moves away from the bottom.
// Explicit input cancels following before the next streaming update can arrive.
export function useChatAutoScroll(messages, layoutKey) {
  const scrollRef = useRef(null);
  const following = useRef(true);
  const previousTop = useRef(0);
  const touchY = useRef(null);
  const layout = useRef(null);
  const followBottom = () => {
    const element = scrollRef.current;
    if (!element || !following.current) return;
    const bottom = Math.max(0, element.scrollHeight - element.clientHeight);
    previousTop.current = bottom;
    element.scrollTo({ top: bottom, behavior: 'instant' });
  };

  // The dock grows with attachments, roles and multiline input. Its real top
  // also includes the audio player below it; a fixed padding cannot cover it.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (layout.current?.element === element) return;
    layout.current?.dispose();
    layout.current = null;
    if (!element) return;
    const dock = element.parentElement?.querySelector('.chat-composer-dock');
    if (!dock) return;
    let frame = 0;
    const previousPadding = element.style.paddingBottom;
    const previousScrollPadding = element.style.scrollPaddingBottom;
    const measure = () => {
      frame = 0;
      if (!element.isConnected || !dock.isConnected) return;
      const padding = `${getComposerDockPadding(element.getBoundingClientRect().bottom, dock.getBoundingClientRect().top)}px`;
      if (element.style.paddingBottom !== padding) {
        element.style.paddingBottom = padding;
        element.style.scrollPaddingBottom = padding;
      }
      followBottom();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    observer.observe(dock);
    const messagesRoot = element.querySelector('.messages');
    if (messagesRoot) observer.observe(messagesRoot);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    layout.current = { element, measure, dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      element.style.paddingBottom = previousPadding;
      element.style.scrollPaddingBottom = previousScrollPadding;
    } };
    measure();
  });
  useLayoutEffect(() => () => { layout.current?.dispose(); layout.current = null; }, []);
  useLayoutEffect(() => {
    layout.current?.measure();
    followBottom();
  }, [messages, layoutKey]);
  const resetFollowing = () => { following.current = true; previousTop.current = 0; };
  const handlers = {
    onScroll(event) {
      const element = event.currentTarget;
      if (element.scrollTop < previousTop.current - 1) following.current = false;
      else if (element.scrollHeight - element.clientHeight - element.scrollTop <= 12) following.current = true;
      previousTop.current = element.scrollTop;
    },
    onWheel(event) { if (event.deltaY < 0) following.current = false; },
    onTouchStart(event) { touchY.current = event.touches[0]?.clientY ?? null; },
    onTouchMove(event) {
      const y = event.touches[0]?.clientY;
      if (touchY.current !== null && y > touchY.current + 2) following.current = false;
      touchY.current = y ?? null;
    },
    onTouchEnd() { touchY.current = null; },
    onKeyDown(event) {
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey)) following.current = false;
    },
  };
  return { scrollRef, resetFollowing, handlers };
}
