import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui.jsx';
import { findSelectMatch, getSelectPlacement, nextSelectIndex } from './select-utils.js';
import './settings.css';
import './select.css';

/** Controlled single select. onChange(value, option); options: { value, label, description?, disabled? }. */
export const Select = forwardRef(function Select({ id: suppliedId, value, onChange, options = [], placeholder = 'Выберите вариант', disabled = false, invalid = false, name, className = '', ...labelProps }, forwardedRef) {
  const generatedId = useId();
  const id = suppliedId || `select-${generatedId}`;
  const listId = `${id}-options`;
  const trigger = useRef(null);
  const panel = useRef(null);
  const query = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [portalTarget, setPortalTarget] = useState(null);
  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = options[selectedIndex];
  const expanded = open && !disabled;
  const activeOption = options[activeIndex];
  useImperativeHandle(forwardedRef, () => trigger.current);

  const close = () => { setOpen(false); query.current.text = ''; };
  const show = edge => {
    if (disabled || !options.some(option => !option.disabled)) return;
    // Keeping the popup in the dialog's DOM preserves its focus and accessibility boundary.
    // The native popover top layer escapes the dialog's overflow/transform clipping.
    setPortalTarget(trigger.current.closest('[aria-modal="true"]') || document.body);
    setActiveIndex(edge === 'first' ? nextSelectIndex(options, -1, 1) : edge === 'last' ? nextSelectIndex(options, 0, -1) : selected && !selected.disabled ? selectedIndex : nextSelectIndex(options, -1, 1));
    setOpen(true);
  };
  const choose = index => {
    const option = options[index];
    if (!option || option.disabled || disabled) return;
    onChange?.(option.value, option);
    close();
    trigger.current?.focus({ preventScroll: true });
  };

  useEffect(() => { if (disabled) close(); }, [disabled]);
  useEffect(() => {
    if (!expanded) return;
    if (!options[activeIndex] || options[activeIndex].disabled) setActiveIndex(nextSelectIndex(options, -1, 1));
  }, [expanded, options, activeIndex]);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!expanded || !element || !portalTarget) return;
    if (typeof element.showPopover === 'function') element.showPopover();
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const visual = window.visualViewport;
      const viewport = { width: visual?.width || document.documentElement.clientWidth, height: visual?.height || window.innerHeight, left: visual?.offsetLeft || 0, top: visual?.offsetTop || 0 };
      element.style.width = `${Math.min(rect.width, viewport.width - 24)}px`;
      const next = getSelectPlacement(rect, element.scrollHeight + 3, viewport);
      Object.assign(element.style, { left: `${next.left}px`, top: `${next.top}px`, width: `${next.width}px`, maxHeight: `${next.maxHeight}px`, visibility: 'visible' });
      element.dataset.placement = next.placement;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(trigger.current);
    observer.observe(element);
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
      if (element.matches(':popover-open')) element.hidePopover();
    };
  }, [expanded, portalTarget]);

  useEffect(() => {
    if (!expanded) return;
    const outside = event => {
      if (!trigger.current?.contains(event.target) && !panel.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [expanded]);

  useLayoutEffect(() => {
    const element = panel.current;
    const active = element?.querySelector('[data-highlighted="true"]');
    if (!expanded || !active) return;
    // Scroll only the option list, never the containing dialog or page.
    const top = active.offsetTop;
    const bottom = top + active.offsetHeight;
    if (top < element.scrollTop + 8) element.scrollTop = Math.max(0, top - 8);
    else if (bottom > element.scrollTop + element.clientHeight - 8) element.scrollTop = bottom - element.clientHeight + 8;
  }, [expanded, activeIndex]);

  const handleKey = event => {
    if (event.nativeEvent.isComposing || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!expanded) { show(event.key === 'Home' ? 'first' : event.key === 'End' || (event.key === 'ArrowUp' && selectedIndex < 0) ? 'last' : undefined); return; }
      const next = event.key === 'Home' ? nextSelectIndex(options, -1, 1) : event.key === 'End' ? nextSelectIndex(options, 0, -1) : nextSelectIndex(options, activeIndex, event.key === 'ArrowDown' ? 1 : -1);
      setActiveIndex(next);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (expanded) choose(activeIndex); else show();
      return;
    }
    if (event.key.length === 1 && !event.altKey) {
      const now = Date.now();
      const previous = now - query.current.at < 700 ? query.current.text : '';
      const text = previous + event.key;
      query.current = { text, at: now };
      const repeated = [...text.toLocaleLowerCase('ru')].every(letter => letter === text[0].toLocaleLowerCase('ru'));
      const match = findSelectMatch(options, repeated ? event.key : text, repeated ? activeIndex : -1);
      if (match >= 0) {
        event.preventDefault();
        if (!expanded) show();
        setActiveIndex(match);
      }
    }
  };

  return <div className={`ds-select ${className}`} data-disabled={disabled || undefined}>
    {name && <input type="hidden" name={name} value={value ?? ''} disabled={disabled}/>}
    <button {...labelProps} ref={trigger} id={id} type="button" role="combobox" className="ds-select-trigger" disabled={disabled} aria-expanded={expanded} aria-haspopup="listbox" aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && activeOption && !activeOption.disabled ? `${id}-option-${activeIndex}` : undefined} aria-invalid={invalid || labelProps['aria-invalid'] || undefined}
      onClick={() => expanded ? close() : show()} onKeyDown={handleKey} onBlur={event => { if (!panel.current?.contains(event.relatedTarget)) close(); }}>
      <span className={selected ? 'ds-select-value' : 'ds-select-value ds-select-placeholder'}>{selected?.label ?? placeholder}</span><Icon name="chevron" size={14}/>
    </button>
    {expanded && portalTarget && createPortal(<div ref={panel} id={listId} popover="manual" role="listbox" aria-label={labelProps['aria-label']} aria-labelledby={labelProps['aria-labelledby'] || (!labelProps['aria-label'] ? id : undefined)} className="settings-panel ds-select-popover" style={{ visibility: 'hidden' }} onPointerDown={event => { if (event.pointerType === 'mouse') event.preventDefault(); }} onMouseDown={event => event.preventDefault()}>
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={index === selectedIndex} aria-disabled={option.disabled || undefined} data-highlighted={index === activeIndex || undefined} className={`settings-row ds-select-option${index === selectedIndex ? ' settings-row-active' : ''}`} onPointerMove={event => { if (event.pointerType === 'mouse' && !option.disabled) setActiveIndex(index); }} onClick={() => choose(index)}>
        <span className="ds-select-option-copy"><span>{option.label}</span>{option.description && <small>{option.description}</small>}</span>{index === selectedIndex && <Icon name="check" size={16}/>}
      </div>)}
    </div>, portalTarget)}
  </div>;
});
