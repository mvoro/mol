import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './popover.css';

export function Popover({ anchorRef, label, onClose, children, className = '', portalTarget, topLayer = false, id }) {
  const ref = useRef(null);
  const callback = useRef(onClose);
  callback.current = onClose;
  const [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (topLayer && typeof element?.showPopover === 'function') element.showPopover();
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = ref.current?.getBoundingClientRect();
      if (!anchor || !panel) return;
      const visual = window.visualViewport;
      const left = visual?.offsetLeft || 0;
      const top = visual?.offsetTop || 0;
      const right = left + (visual?.width || window.innerWidth);
      const bottom = top + (visual?.height || window.innerHeight);
      const above = topLayer ? bottom - anchor.bottom < panel.height + 16 && anchor.top - top >= panel.height + 16 : anchor.top - top >= panel.height + 16;
      setPosition({ left: Math.max(left + 8, Math.min(anchor.left, right - panel.width - 8)), top: Math.max(top + 8, Math.min(above ? anchor.top - panel.height - 8 : anchor.bottom + 8, bottom - panel.height - 8)), transformOrigin: above ? 'bottom left' : 'top left' });
    };
    place();
    const observer = new ResizeObserver(place);
    if (element) observer.observe(element);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
      if (topLayer && element?.matches(':popover-open')) element.hidePopover();
    };
  }, [anchorRef, topLayer]);
  const focused = useRef(false);
  useEffect(() => {
    if (!position || focused.current) return;
    focused.current = true;
    (ref.current?.querySelector('[role^="menuitem"][aria-checked="true"]') || ref.current?.querySelector('[role^="menuitem"]'))?.focus({ preventScroll: true });
  }, [position]);
  useEffect(() => {
    const outside = event => {
      if (!ref.current?.contains(event.target) && !anchorRef.current?.contains(event.target)) callback.current();
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      if (document.activeElement === document.body || ref.current?.contains(document.activeElement)) anchorRef.current?.focus({ preventScroll: true });
    };
  }, [anchorRef]);
  const handleKey = event => {
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault(); anchorRef.current?.focus({ preventScroll: true }); callback.current(); return;
    }
    const items = [...ref.current.querySelectorAll('[role^="menuitem"]:not(:disabled)')];
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (index + 1) % items.length : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length : null;
    if (next !== null) { event.preventDefault(); items[next]?.focus(); }
  };
  return createPortal(<div ref={ref} id={id} popover={topLayer ? 'manual' : undefined} role="menu" aria-label={label} className={`ds-popover ${className}`} style={position || { visibility: 'hidden' }} onKeyDown={handleKey}>{children}</div>, portalTarget || document.body);
}

export function MenuItem({ icon, children, trailing, danger = false, onClick, ...props }) {
  return <button type="button" role="menuitem" className={`ds-menu-item${danger ? ' ds-menu-danger' : ''}`} onClick={onClick} {...props}>{icon}<span>{children}</span>{trailing}</button>;
}
