import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, X, Download } from 'lucide-react';
import { documentFormat, panelBounds, panelWidth } from '../artifact-model.js';
import './artifact-panel.css';
const DocumentPreview = lazy(() => import('./DocumentPreview.jsx'));
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex="0"]';
export function ArtifactPanel({ file, open, onClose, full, onFullChange, mobile }) {
  const panel = useRef(null), trigger = useRef(null), drag = useRef(null);
  const fullMotion = useRef(null), previousExpanded = useRef(null), skipFullMotion = useRef(false);
  const [total, setTotal] = useState(1000);
  const [ratio, setRatio] = useState(() => {
    try { return Number(localStorage.getItem('molecula-artifact-width')) || .5; } catch { return .5; }
  });
  const [sheetHeight, setSheetHeight] = useState(68);
  const [download, setDownload] = useState(null);
  const [dragging, setDragging] = useState(false);
  const width = panelWidth(total * ratio, total);
  // A narrow desktop workspace uses the entire work area until split minima fit.
  const expanded = full || (!mobile && total < 660);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useLayoutEffect(() => {
    const main = panel.current.parentElement;
    const observer = new ResizeObserver(([entry]) => setTotal(entry.contentRect.width - (mobile ? 0 : 16)));
    observer.observe(main);
    return () => observer.disconnect();
  }, [mobile]);
  useLayoutEffect(() => {
    const main = panel.current.parentElement;
    const changingFull = previousExpanded.current !== null && previousExpanded.current !== expanded && open && !mobile;
    const before = changingFull ? panel.current.getBoundingClientRect() : null;
    if (changingFull) {
      fullMotion.current?.cancel();
      panel.current.style.transition = 'none';
    }
    main.dataset.artifactOpen = String(open);
    main.dataset.artifactFull = String(open && expanded && !mobile);
    main.dataset.artifactDragging = String(dragging);
    main.style.setProperty('--artifact-width', `${width}px`);
    if (changingFull) {
      const after = panel.current.getBoundingClientRect();
      if (!skipFullMotion.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        fullMotion.current = panel.current.animate([
          {transform:`translateX(${before.left - after.left}px)`},
          {transform:'translateX(0)'},
        ], {duration:240, easing:'cubic-bezier(.32,.72,0,1)'});
      }
      panel.current.style.transition = '';
    }
    previousExpanded.current = expanded;
    skipFullMotion.current = false;
    return () => { delete main.dataset.artifactOpen; delete main.dataset.artifactFull; delete main.dataset.artifactDragging; };
  }, [open, expanded, mobile, width, dragging]);
  useEffect(() => {
    if (!open) return;
    trigger.current = document.activeElement;
    panel.current.focus({ preventScroll: true });
    return () => { if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const modal = mobile;
    const previousOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (modal && event.key === 'Tab') {
        const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter(el => el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.current.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); if (modal) document.body.style.overflow = previousOverflow; };
  }, [open, mobile, expanded]);
  useEffect(() => {
    if (!dragging) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => { document.body.style.userSelect = previous; };
  }, [dragging]);
  useEffect(() => { if (!open) { drag.current = null; setDragging(false); } }, [open]);
  const saveWidth = value => {
    setRatio(value / total);
    try { localStorage.setItem('molecula-artifact-width', String(value / total)); } catch { /* Session remains usable. */ }
  };
  const start = (event, sheet = false) => {
    if (event.button !== 0 || drag.current) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x:event.clientX, y:event.clientY, started:performance.now(), width, height:sheetHeight, sheet, lastWidth:width, lastHeight:sheetHeight };
    setDragging(true);
  };
  const move = event => {
    const state = drag.current; if (!state) return;
    if (state.sheet) {
      state.lastHeight = Math.max(20, Math.min(94, state.height + (state.y - event.clientY) / window.innerHeight * 100));
      setSheetHeight(state.lastHeight);
    } else {
      const requestedWidth = state.width + state.x - event.clientX;
      if (requestedWidth >= panelBounds(total).max && state.x - event.clientX >= 8) {
        // Finish capture before removing the divider. Restore returns to the
        // split width from before this gesture, rather than the extreme edge.
        drag.current = null;
        setDragging(false);
        saveWidth(state.width);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        panel.current.focus({preventScroll:true});
        onFullChange(true);
        return;
      }
      state.lastWidth = panelWidth(requestedWidth, total);
      setRatio(state.lastWidth / total);
    }
  };
  const finish = (event, cancelled = false) => {
    const state = drag.current; if (!state) return;
    drag.current = null; setDragging(false);
    if (state.sheet) {
      if (!cancelled && (state.lastHeight < 42 || (event.clientY - state.y > 120 && (event.clientY - state.y) / Math.max(1, performance.now() - state.started) > .8))) { onClose(); setSheetHeight(68); }
      else setSheetHeight(state.lastHeight > 80 ? 94 : 68);
    } else {
      // Capture can be lost when the host browser interrupts a drag. Keep the
      // last visible width instead of jumping back to the drag start.
      saveWidth(panelWidth(state.lastWidth, total));
    }
  };
  const bounds = panelBounds(total);
  return <>
    {mobile && open && <div className="artifact-backdrop" onClick={onClose} aria-hidden="true" />}
    <aside ref={panel} className={`artifact-panel${open ? ' is-open' : ''}${dragging ? ' is-dragging' : ''}`} tabIndex={-1}
      role={mobile ? 'dialog' : 'region'} aria-modal={open && mobile ? true : undefined}
      aria-label={file ? `Предпросмотр: ${file.name}` : 'Предпросмотр документа'} aria-hidden={!open} inert={!open}
      style={{'--sheet-height':`${sheetHeight}dvh`}}>
      {file && <>
        {!mobile && !expanded && <div className="artifact-resizer" role="separator" aria-label="Ширина предпросмотра" aria-orientation="vertical" tabIndex={open ? 0 : -1}
          aria-valuemin={Math.round(bounds.min / total * 100)} aria-valuemax={Math.round(bounds.max / total * 100)} aria-valuenow={Math.round(width / total * 100)} aria-valuetext={`${Math.round(width / total * 100)}% рабочей области`}
          onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)}
          onKeyDown={event => {
            let value;
            if (event.key === 'ArrowLeft') value = width + (event.shiftKey ? 50 : 10);
            if (event.key === 'ArrowRight') value = width - (event.shiftKey ? 50 : 10);
            if (event.key === 'Home') value = bounds.min;
            if (event.key === 'End') value = bounds.max;
            if (value !== undefined) { event.preventDefault(); saveWidth(panelWidth(value, total)); }
          }} />}
        {mobile && <button type="button" className="artifact-sheet-handle" aria-label={sheetHeight > 80 ? 'Уменьшить высоту предпросмотра' : 'Увеличить высоту предпросмотра'}
          onPointerDown={event => start(event, true)} onPointerMove={move} onPointerUp={finish} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)}
          onClick={event => { if (event.detail === 0) setSheetHeight(h => h > 80 ? 68 : 94); }}><span aria-hidden="true"/></button>}
        <header className="artifact-header">
          <div className="artifact-title"><strong title={file.name}>{file.name}</strong><span>{documentFormat(file)?.toUpperCase()}</span></div>
          {download?.key === (file.id || file.url || file.name) ? <a className="artifact-icon" href={download.url} download={file.name} aria-label="Скачать исходный файл"><Download/></a> : <button className="artifact-icon" disabled aria-label="Скачать исходный файл"><Download/></button>}
          <button className="artifact-icon" aria-label={(mobile ? sheetHeight > 80 : full) ? 'Восстановить размер' : 'Развернуть предпросмотр'} onClick={event => { skipFullMotion.current = event.detail === 0; mobile ? setSheetHeight(h => h > 80 ? 68 : 94) : onFullChange(!full); }}>{(mobile ? sheetHeight > 80 : full) ? <Minimize2/> : <Maximize2/>}</button>
          <button className="artifact-icon" aria-label="Скрыть предпросмотр" onClick={onClose}><X/></button>
        </header>
        <Suspense fallback={<div className="artifact-state" role="status">Загружаем просмотрщик…</div>}><DocumentPreview file={file} visible={open} onDownloadChange={setDownload}/></Suspense>
      </>}
    </aside>
  </>;
}
