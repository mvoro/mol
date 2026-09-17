import { useId, useRef, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import { PROJECT_COLORS, ProjectIcon } from './Projects.jsx';
import { MenuItem, Popover } from './Popover.jsx';
import { TextInput } from './TextInput.jsx';
import './project-color-picker.css';

const COLOR_NAMES = ['Оранжевый', 'Синий', 'Лавандовый', 'Зелёный', 'Красный', 'Фиолетовый', 'Розовый', 'Серый'];
const normalizeHex = value => {
  const text = value.trim().replace(/^#/, '');
  if (/^[\da-f]{6}$/i.test(text)) return `#${text.toLowerCase()}`;
  if (/^[\da-f]{3}$/i.test(text)) return `#${[...text].map(letter => letter + letter).join('').toLowerCase()}`;
  return null;
};

export function ProjectColorPicker({ value, onChange }) {
  const id = useId();
  const trigger = useRef(null);
  const customInput = useRef(null);
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(value);
  const normalized = normalizeHex(draft);
  const current = normalizeHex(value) || PROJECT_COLORS[0];
  const choose = next => { onChange(next); setDraft(next); };
  const toggle = () => {
    if (!open) {
      setPortalTarget(trigger.current.closest('[aria-modal="true"]') || document.body);
      setDraft(current);
      setCustom(!PROJECT_COLORS.includes(current));
    }
    setOpen(previous => !previous);
  };
  const gridKey = event => {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 }[event.key];
    if (!offset) return;
    const items = [...event.currentTarget.querySelectorAll('[role="menuitemradio"]')];
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    event.stopPropagation();
    const next = index + offset;
    if (event.key === 'ArrowDown' && next >= items.length) event.currentTarget.parentElement.querySelector('[role="menuitem"]')?.focus();
    else if (event.key === 'ArrowUp' && next < 0) items[index]?.focus();
    else items[(next + items.length) % items.length]?.focus();
  };
  return <>
    <button ref={trigger} type="button" className="project-color-trigger" aria-label="Изменить цвет проекта" title="Изменить цвет проекта" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} onKeyDown={event => {
      if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); toggle(); }
      if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    }}><ProjectIcon color={value} size={20}/></button>
    {open && <Popover id={id} anchorRef={trigger} portalTarget={portalTarget} topLayer label="Цвет проекта" className="project-color-popover" onClose={() => setOpen(false)}>
      <div className="project-color-swatches" role="group" aria-label="Цвета папки" onKeyDown={gridKey}>
        {PROJECT_COLORS.map((color, index) => <button key={color} type="button" role="menuitemradio" aria-checked={current === color} aria-label={COLOR_NAMES[index]} title={COLOR_NAMES[index]} className="project-color-swatch" style={{ '--folder-color': color }} onClick={() => choose(color)}><span/></button>)}
      </div>
      <MenuItem icon={<span className="project-custom-color-dot"/>} aria-expanded={custom} aria-controls={`${id}-custom`} trailing={<CaretDown size={14} className={custom ? 'is-expanded' : ''}/>} onClick={() => {
        setCustom(previous => !previous);
        if (!custom && document.body.dataset.input === 'keyboard') requestAnimationFrame(() => customInput.current?.focus({ preventScroll: true }));
      }} onKeyDown={event => {
        if (custom && (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey))) {
          event.preventDefault();
          event.stopPropagation();
          customInput.current?.focus({ preventScroll: true });
        }
      }}>Свой цвет</MenuItem>
      {custom && <div id={`${id}-custom`} className="project-custom-color-controls" onKeyDown={event => {
        if (event.key === 'Escape') return;
        event.stopPropagation();
        if (event.key === 'Enter' && event.target.type !== 'color') { event.preventDefault(); if (normalized) choose(normalized); }
      }}>
        <input type="color" value={current} aria-label="Выбрать свой цвет" onChange={event => choose(event.target.value)}/>
        <TextInput ref={customInput} aria-label="Цвет в формате HEX" value={draft} onChange={event => setDraft(event.target.value)} maxLength={7} placeholder="#7a3fff" spellCheck={false} autoComplete="off" aria-invalid={!normalized}/>
        <button type="button" className="project-color-apply" aria-label="Применить свой цвет" disabled={!normalized} onClick={() => choose(normalized)}><Check size={18}/></button>
      </div>}
      <div className="ds-menu-separator" role="separator"/>
      <MenuItem onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}>Закрыть меню</MenuItem>
    </Popover>}
  </>;
}
