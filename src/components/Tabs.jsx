import React, { useId, useLayoutEffect, useRef } from 'react';
import './tabs.css';

/** The shared segmented control, including keyboard navigation and narrow-screen overflow. */
export function Tabs({ items, value, onChange, label, className = '', disabled = false, id: suppliedId }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const track = useRef(null);
  const buttons = useRef(new Map());
  useLayoutEffect(() => {
    const element = track.current;
    const active = buttons.current.get(value);
    if (!element || !active || element.clientWidth === 0) return;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < element.scrollLeft + 4) element.scrollLeft = Math.max(0, left - 4);
    else if (right > element.scrollLeft + element.clientWidth - 4) element.scrollLeft = right - element.clientWidth + 4;
  }, [value]);
  const navigate = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabled = items.filter(item => !item.disabled);
    if (disabled || !enabled.length) return;
    const position = enabled.findIndex(item => item.id === items[index].id);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (position + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    onChange(enabled[next].id);
    buttons.current.get(enabled[next].id)?.focus({ preventScroll: true });
  };
  return <div ref={track} className={`ui-tabs ${className}`} role="tablist" aria-label={label}>
    {items.map((item, index) => <button
      ref={element => { if (element) buttons.current.set(item.id, element); else buttons.current.delete(item.id); }}
      key={item.id}
      id={`${id}-tab-${item.id}`}
      type="button"
      role="tab"
      className={`ui-tab${value === item.id ? ' is-active' : ''}`}
      aria-selected={value === item.id}
      aria-controls={item.controls}
      tabIndex={value === item.id ? 0 : -1}
      disabled={disabled || item.disabled}
      onClick={() => onChange(item.id)}
      onKeyDown={event => navigate(event, index)}
    >{item.icon}<span>{item.label}</span>{item.count != null && <small>{item.count}</small>}</button>)}
  </div>;
}
