import React, { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownLeft, ImageIcon } from 'lucide-react';
import { Icon } from '../ui.jsx';
import { filterPhotos, mentionQuery, normalizeParts, partsText } from '../prompt-mentions.js';
import './prompt-input.css';

const CLIPBOARD_TYPE = 'application/x-molecula-prompt';
function readParts(root, { ignoreTrailingPlaceholder = true } = {}) {
  const parts = [];
  const text = value => {
    if (!value) return;
    if (parts.at(-1)?.type === 'text') parts.at(-1).text += value;
    else parts.push({ type: 'text', text: value });
  };
  const walk = parent => [...parent.childNodes].forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) text(node.data.replace(/\u200b/g, ''));
    else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.dataset.mentionId) parts.push({ type: 'attachment', fileId: node.dataset.mentionId, name: node.dataset.mentionName });
      else if (node.tagName === 'BR') { if (!ignoreTrailingPlaceholder || index !== parent.childNodes.length - 1 || parent !== root) text('\n'); }
      else { if (['DIV','P'].includes(node.tagName) && parts.length && !partsText(parts).endsWith('\n')) text('\n'); walk(node); }
    }
  });
  walk(root);
  return parts;
}
function mentionNode(file) {
  const token = document.createElement('span');
  token.className = 'prompt-mention';
  token.contentEditable = 'false';
  token.dataset.mentionId = file.id;
  token.dataset.mentionName = file.name;
  token.title = file.name;
  if (file.url || file.preview) {
    const image = document.createElement('img');
    image.src = file.url || file.preview;
    image.alt = '';
    image.draggable = false;
    token.append(image);
  }
  const label = document.createElement('span');
  label.textContent = `@${file.name}`;
  token.append(label);
  return token;
}
function fragmentFor(parts, files) {
  const fragment = document.createDocumentFragment();
  for (const part of normalizeParts(parts, files)) {
    if (part.type === 'attachment') fragment.append(mentionNode(files.find(file => file.id === part.fileId)));
    else fragment.append(document.createTextNode(part.text));
  }
  return fragment;
}
function putCaretAtEnd(root) {
  const range = document.createRange(); range.selectNodeContents(root); range.collapse(false);
  const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
}

export const PromptInput = forwardRef(function PromptInput({ value, onChange, files, disabled, onKeyDown, onUpload, onMentionOpen, placeholder = 'Спросите что-нибудь…' }, ref) {
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const queryRef = useRef(null);
  const composing = useRef(false);
  const currentFiles = useRef(files);
  const [query, setQuery] = useState(null);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState(null);
  const id = useId();
  currentFiles.current = files;
  const candidates = filterPhotos(files, query?.query || '');
  const allPhotos = filterPhotos(files, '');
  const close = () => { queryRef.current = null; setQuery(null); };
  const report = () => {
    const parts = normalizeParts(readParts(rootRef.current), currentFiles.current);
    onChange(partsText(parts), parts);
    rootRef.current.dataset.empty = String(partsText(parts).length === 0);
  };
  const showQuery = () => {
    if (composing.current || disabled || document.activeElement !== rootRef.current) return close();
    const selection = window.getSelection();
    if (!selection?.isCollapsed || !rootRef.current.contains(selection.anchorNode) || selection.anchorNode.nodeType !== Node.TEXT_NODE || selection.anchorNode.parentElement.closest('[data-mention-id]')) return close();
    const found = mentionQuery(selection.anchorNode.data, selection.anchorOffset);
    if (!found) return close();
    const range = document.createRange();
    range.setStart(selection.anchorNode, found.start); range.setEnd(selection.anchorNode, found.end);
    const next = { ...found, range };
    if (queryRef.current?.query !== found.query) setActive(0);
    if (!queryRef.current) onMentionOpen?.();
    queryRef.current = next; setQuery(next);
  };
  const replaceAll = parts => {
    const root = rootRef.current;
    const focused = document.activeElement === root;
    root.replaceChildren(fragmentFor(parts, currentFiles.current));
    if (focused) putCaretAtEnd(root);
    report(); close();
  };
  useImperativeHandle(ref, () => ({ element: rootRef.current, focus: options => rootRef.current.focus(options), getParts: () => readParts(rootRef.current), setParts: replaceAll }));
  useLayoutEffect(() => {
    if (!composing.current && partsText(readParts(rootRef.current)) !== value) replaceAll([{ type: 'text', text: value }]);
    rootRef.current.dataset.empty = String(!value);
  }, [value]);
  useEffect(() => {
    if (composing.current) return;
    const before = readParts(rootRef.current);
    const after = normalizeParts(before, files);
    if (JSON.stringify(before) !== JSON.stringify(after)) replaceAll(after);
    if (queryRef.current) setActive(0);
  }, [files]);
  useEffect(() => { if (disabled) close(); }, [disabled]);
  useEffect(() => {
    const selection = () => { if (queryRef.current) showQuery(); };
    document.addEventListener('selectionchange', selection);
    return () => document.removeEventListener('selectionchange', selection);
  }, [disabled]);
  useLayoutEffect(() => {
    if (!query) { setPosition(null); return; }
    const place = () => {
      const anchor = rootRef.current.closest('.composer-field').getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = (viewport?.offsetTop || 0) + 8;
      const bottom = (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 8;
      const width = Math.min(432, anchor.width, innerWidth - 32);
      const availableAbove = anchor.top - top - 8;
      const availableBelow = bottom - anchor.bottom - 8;
      const above = availableAbove > 140 || availableAbove >= availableBelow;
      const maxHeight = Math.min(300, Math.max(80, above ? availableAbove : availableBelow));
      const height = Math.min((menuRef.current?.scrollHeight || 200) + 2, maxHeight);
      const next = { left: Math.max(16, Math.min(anchor.left, innerWidth - width - 16)), top: above ? Math.max(top, anchor.top - height - 8) : anchor.bottom + 8, width, maxHeight };
      setPosition(previous => previous && Object.keys(next).every(key => Math.abs(previous[key] - next[key]) < .5) ? previous : next);
    };
    const outside = event => { if (!rootRef.current.contains(event.target) && !menuRef.current?.contains(event.target)) close(); };
    let frame;
    const queuePlace = () => { clearTimeout(frame); frame = setTimeout(place, 0); };
    const observer = new ResizeObserver(queuePlace);
    observer.observe(rootRef.current.closest('.composer-field'));
    const ancestors = [];
    for (let element = rootRef.current.parentElement; element; element = element.parentElement) {
      ancestors.push(element);
      element.addEventListener('scroll', queuePlace, { passive: true });
    }
    place();
    // The home curtain also moves the anchor with a transform after scrolling.
    // Track that motion only while suggestions are open, without idle rerenders.
    const motionTracker = setInterval(place, 50);
    window.addEventListener('resize', queuePlace);
    window.addEventListener('scroll', queuePlace, true);
    window.visualViewport?.addEventListener('resize', queuePlace);
    window.visualViewport?.addEventListener('scroll', queuePlace);
    document.addEventListener('pointerdown', outside, true);
    return () => { clearInterval(motionTracker); clearTimeout(frame); observer.disconnect(); ancestors.forEach(element => element.removeEventListener('scroll', queuePlace)); window.removeEventListener('resize', queuePlace); window.removeEventListener('scroll', queuePlace, true); window.visualViewport?.removeEventListener('resize', queuePlace); window.visualViewport?.removeEventListener('scroll', queuePlace); document.removeEventListener('pointerdown', outside, true); };
  }, [Boolean(query), candidates.length, allPhotos.length]);
  const insertFragment = fragment => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !rootRef.current.contains(selection.anchorNode)) putCaretAtEnd(rootRef.current);
    const wrapper = document.createElement('div'); wrapper.append(fragment);
    if (!wrapper.childNodes.length) return;
    // Native editing transactions preserve Undo/Redo and the active caret.
    const before = rootRef.current.innerHTML;
    const previousSelection = [selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset];
    const inserted = document.execCommand('insertHTML', false, wrapper.innerHTML);
    const nextSelection = window.getSelection();
    const selectionUnchanged = previousSelection.every((value, index) => value === [nextSelection.anchorNode, nextSelection.anchorOffset, nextSelection.focusNode, nextSelection.focusOffset][index]);
    if (!inserted && rootRef.current.innerHTML === before && selectionUnchanged) {
      const range = window.getSelection().getRangeAt(0); range.deleteContents();
      const nodes = [...wrapper.childNodes]; const last = nodes.at(-1);
      range.insertNode(fragmentFor(readParts(wrapper), currentFiles.current));
      if (last) putCaretAtEnd(rootRef.current);
    }
    report();
  };
  const choose = file => {
    const pending = queryRef.current;
    if (!pending || !rootRef.current.contains(pending.range.startContainer) || !currentFiles.current.some(item => item.id === file.id)) return close();
    rootRef.current.focus({ preventScroll: true });
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(pending.range);
    const token = mentionNode(file);
    const instance = crypto.randomUUID();
    token.dataset.mentionInstance = instance;
    const fragment = document.createDocumentFragment(); fragment.append(token, document.createTextNode(' '));
    insertFragment(fragment);
    const inserted = rootRef.current.querySelector(`[data-mention-instance="${instance}"]`);
    if (inserted) {
      const after = document.createRange();
      if (inserted.nextSibling?.nodeType === Node.TEXT_NODE) after.setStart(inserted.nextSibling, Math.min(1, inserted.nextSibling.length));
      else after.setStartAfter(inserted);
      after.collapse(true); selection.removeAllRanges(); selection.addRange(after);
    }
    close();
  };
  const removeAdjacent = backwards => {
    const selection = window.getSelection();
    if (!selection?.isCollapsed || !rootRef.current.contains(selection.anchorNode)) return false;
    const node = selection.anchorNode;
    const offset = selection.anchorOffset;
    const adjacent = node.nodeType === Node.TEXT_NODE
      ? (backwards && offset === 0 ? node.previousSibling : !backwards && offset === node.length ? node.nextSibling : null)
      : node.childNodes[backwards ? offset - 1 : offset];
    if (!adjacent?.dataset?.mentionId) return false;
    const range = document.createRange(); range.selectNode(adjacent); selection.removeAllRanges(); selection.addRange(range);
    document.execCommand('delete'); report(); close(); return true;
  };
  const copy = (event, cut) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const wholeEditor = range.startContainer === rootRef.current && range.startOffset === 0 && range.endContainer === rootRef.current && range.endOffset === rootRef.current.childNodes.length;
    const parts = readParts(wholeEditor ? rootRef.current : range.cloneContents(), { ignoreTrailingPlaceholder: wholeEditor });
    event.preventDefault(); event.clipboardData.setData('text/plain', partsText(parts));
    event.clipboardData.setData(CLIPBOARD_TYPE, JSON.stringify(parts));
    if (cut) { document.execCommand('delete'); report(); showQuery(); }
  };
  return <>
    <div ref={rootRef} className="prompt-input" data-composer-input data-empty={!value} role="textbox" aria-label="Сообщение" aria-multiline="true" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={Boolean(query)} aria-controls={query ? `${id}-list` : undefined} aria-activedescendant={query && candidates[active] ? `${id}-${candidates[active].id}` : undefined} aria-disabled={disabled || undefined} contentEditable={!disabled} suppressContentEditableWarning spellCheck={false} data-placeholder={placeholder} onInput={() => { if (!composing.current) { report(); showQuery(); } }} onFocus={showQuery} onClick={showQuery} onKeyUp={event => { if (!['Escape','Enter','Tab','ArrowUp','ArrowDown'].includes(event.key)) showQuery(); }} onBlur={close}
      onCompositionStart={() => { composing.current = true; rootRef.current.dataset.empty = 'false'; close(); }} onCompositionEnd={() => { composing.current = false; report(); showQuery(); }}
      onBeforeInput={event => { if (!composing.current && ['deleteContentBackward','deleteContentForward'].includes(event.nativeEvent.inputType) && removeAdjacent(event.nativeEvent.inputType === 'deleteContentBackward')) event.preventDefault(); }}
      onKeyDown={event => {
        if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (queryRef.current) {
          if (['ArrowDown','ArrowUp'].includes(event.key)) {
            event.preventDefault(); event.stopPropagation();
            const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + candidates.length) % Math.max(1,candidates.length);
            setActive(next); menuRef.current?.querySelectorAll('[role="option"]')[next]?.scrollIntoView({ block: 'nearest' }); return;
          }
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
          if (event.key === 'Enter' || event.key === 'Tab') {
            if (event.key === 'Tab' && !candidates[active]) { close(); return; }
            event.preventDefault(); event.stopPropagation();
            if (candidates[active]) choose(candidates[active]);
            else { close(); if (!allPhotos.length) onUpload(); }
            return;
          }
        }
        if (['Backspace','Delete'].includes(event.key) && !event.metaKey && !event.ctrlKey && removeAdjacent(event.key === 'Backspace')) { event.preventDefault(); return; }
        if (event.key === 'Enter' && (event.shiftKey || !(event.metaKey || event.ctrlKey))) {
          onKeyDown(event);
          if (!event.defaultPrevented) { event.preventDefault(); document.execCommand('insertLineBreak'); report(); }
          return;
        }
        onKeyDown(event);
      }}
      onCopy={event => copy(event,false)} onCut={event => copy(event,true)} onPaste={event => {
        event.preventDefault();
        let parts; try { parts = JSON.parse(event.clipboardData.getData(CLIPBOARD_TYPE)); } catch { /* External clipboard is plain text. */ }
        if (Array.isArray(parts)) insertFragment(fragmentFor(parts, currentFiles.current));
        else { document.execCommand('insertText',false,event.clipboardData.getData('text/plain')); report(); }
        showQuery();
      }}/>
    {query && createPortal(<div ref={menuRef} className="mention-popover" style={{ ...position, visibility: position ? 'visible' : 'hidden' }} onPointerDown={event => event.preventDefault()}>
      <div className="mention-heading" id={`${id}-heading`}>Прикреплённые фото <span>{allPhotos.length || ''}</span></div>
      <div role="listbox" id={`${id}-list`} aria-labelledby={`${id}-heading`}>{candidates.map((file,index) => <button key={file.id} id={`${id}-${file.id}`} type="button" role="option" aria-selected={active === index} tabIndex={-1} className="mention-option" onPointerMove={event => { if (event.pointerType === 'mouse') setActive(index); }} onClick={() => choose(file)}>{file.url || file.preview ? <img src={file.url || file.preview} alt=""/> : <ImageIcon size={20} aria-hidden="true" strokeWidth={1.75}/>}<span><b>{file.name}</b><small>{file.refLabel || `Фото ${allPhotos.findIndex(item => item.id === file.id) + 1}`}</small></span>{active === index && <CornerDownLeft size={14} aria-hidden="true" strokeWidth={1.75}/>}</button>)}</div>
      {!candidates.length && <p className="mention-empty">{allPhotos.length ? 'Фото с таким названием не найдено' : 'Прикрепите фото, чтобы упомянуть его'}</p>}
      {!allPhotos.length && <button className="mention-option mention-upload" onClick={() => { close(); onUpload(); }}><Icon name="add" size={18}/><span>Добавить фото</span></button>}
    </div>, document.body)}
  </>;
});

export function PromptText({ text, parts, files = [] }) {
  if (!parts?.length) return text;
  return parts.map((part,index) => {
    if (part.type !== 'attachment') return <React.Fragment key={index}>{part.text}</React.Fragment>;
    const file = files.find(item => item.id === part.fileId);
    return <span className="prompt-mention" key={index} title={part.name}>{file?.url || file?.preview ? <img src={file.url || file.preview} alt=""/> : null}<span>@{part.name}</span></span>;
  });
}
