import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui.jsx';
import { Select } from './Select.jsx';
import { Tabs } from './Tabs.jsx';
import { DEFAULT_TREND_DRAFT, TREND_TEMPLATES, drawTrendFrame, getTrendTemplate, loadTrendImage, renderTrendVideo, validateCharacter, validateTrendDraft } from '../trends-engine.js';
import { loadTrendsStudio, saveTrendsStudio } from '../trends-storage.js';
import { withTrendVideoDuration } from '../trends-webm.js';
import { estimateTrendCost, formatGenerationCost } from '../generation-cost.js';
import './trends-studio.css';
import './studio-flow.css';

const MediaViewer = lazy(() => import('./MediaViewer.jsx').then(module => ({ default: module.MediaViewer })));

function useBlobUrl(blob) {
  const [url, setUrl] = useState('');
  useEffect(() => { if (!blob) { setUrl(''); return; } const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [blob]);
  return url;
}
function MotionPreview({ template, active = false, className = '' }) {
  const canvas = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    let frame = 0;
    loadTrendImage(template.poster, controller.signal).then(picture => {
      const context = canvas.current?.getContext('2d', { alpha: false });
      if (!context) return;
      drawTrendFrame(context, picture, template, 0);
      if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const start = performance.now();
      const draw = now => { drawTrendFrame(context, picture, template, ((now - start) % (template.duration * 1000)) / (template.duration * 1000)); frame = requestAnimationFrame(draw); };
      frame = requestAnimationFrame(draw);
    }).catch(() => {});
    return () => { controller.abort(); cancelAnimationFrame(frame); };
  }, [template, active]);
  return <canvas ref={canvas} width="252" height="448" className={`trend-motion-preview ${className}`} aria-hidden="true" style={{ backgroundImage: `url(${template.poster})` }}/>;
}
function TrendCard({ template, selected, onSelect, disabled, active }) {
  const [hovered, setHovered] = useState(false);
  return <button type="button" className={`trend-card${selected ? ' is-selected' : ''}`} aria-pressed={selected} aria-label={`${template.name}. ${template.description}. ${template.duration} секунд`} disabled={disabled} onClick={() => onSelect(template.id)} onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}>
    <MotionPreview template={template} active={active && (hovered || selected)}/>
    <span className="trend-card-shade"/>
    {template.tag && <span className={`trend-card-tag${template.tag === 'Новое' ? ' is-new' : ''}`}>{template.tag === 'Популярное' && <Icon name="external" size={10}/>}{template.tag}</span>}
    <span className={`trend-card-check${selected ? ' is-selected' : ''}`}>{selected ? <Icon name="check" size={15}/> : <Icon name="play" size={13}/>}</span>
    <span className="trend-card-copy"><strong>{template.name}</strong><span>{template.category === 'camera' ? 'Камера' : 'Движение кадра'}<i>·</i>{template.duration} сек</span></span>
  </button>;
}
function SavedVideo({ result, onOpen }) {
  const cover = useBlobUrl(result.character?.blob);
  return <button className="trend-saved-card" onClick={() => onOpen(result)}><span><img src={cover || undefined} alt=""/><i><Icon name="play" size={18}/></i></span><strong>{result.templateName}</strong><small>{result.quality}p · {result.duration} сек</small></button>;
}
function TrendResultViewer({ result, onClose }) {
  const url = useBlobUrl(result.blob);
  const poster = useBlobUrl(result.character?.blob);
  const extension = result.extension === 'mp4' || result.blob.type.includes('mp4') ? 'mp4' : 'webm';
  const items = url ? [{ id: result.id, type: 'video', src: url, poster, ratio: '9:16', duration: result.duration, sound: false, title: result.caption || result.templateName, filename: `molecula-${result.templateId}-${result.id.slice(0, 8)}.${extension}`, label: 'Видео', details: `${result.quality}p · 9:16 · ${result.duration} сек` }] : [];
  return <Suspense fallback={null}><MediaViewer items={items} initialId={result.id} onClose={onClose} loading={!url}/></Suspense>;
}

export function TrendsStudio({ onNotify, onComplete, openResultId, onResultOpened, active = true }) {
  const [draft, setDraft] = useState(DEFAULT_TREND_DRAFT);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('templates');
  const [mobileStep, setMobileStep] = useState(1);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [photoRequired, setPhotoRequired] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [dragging, setDragging] = useState(false);
  const root = useRef(null);
  const gallery = useRef(null);
  const stepHeading = useRef(null);
  const upload = useRef(null);
  const job = useRef(null);
  const uploadJob = useRef(0);
  const routeActive = useRef(active);
  routeActive.current = active;
  const busy = status === 'generating';
  const disabled = busy || !ready || status === 'uploading';
  const characterUrl = useBlobUrl(draft.character?.blob);
  const template = getTrendTemplate(draft.templateId);
  const costLabel = formatGenerationCost(estimateTrendCost(draft));

  useEffect(() => {
    let mounted = true;
    loadTrendsStudio().then(async saved => {
      if (!mounted || !saved) return;
      if (saved.draft) setDraft({ ...DEFAULT_TREND_DRAFT, ...saved.draft, templateId: getTrendTemplate(saved.draft.templateId) ? saved.draft.templateId : '' });
      if (Array.isArray(saved.history)) {
        const restored = await Promise.all(saved.history.filter(item => item.blob instanceof Blob && item.character?.blob instanceof Blob).slice(0, 6).map(async item => {
          try { return { ...item, blob: await withTrendVideoDuration(item.blob, item.duration) }; } catch { return item; }
        }));
        if (mounted) setHistory(restored);
      }
    }).catch(() => { if (mounted) setStorageError('Сохранение в этом браузере недоступно. Скачайте готовое видео перед закрытием.'); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; job.current?.abort(); uploadJob.current++; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // IndexedDB stores the actual image and video blobs, not temporary object URLs.
    saveTrendsStudio({ draft, history }).catch(() => setStorageError('Не удалось сохранить работу в браузере. Скачайте готовое видео.'));
  }, [draft, history, ready]);

  useEffect(() => { if (!active) setResult(null); }, [active]);

  useEffect(() => {
    if (!ready || !openResultId) return;
    const requested = history.find(item => item.id === openResultId);
    if (requested) { setResult(requested); setView('history'); }
    else { setResult(null); setView('history'); onNotify?.('Это видео уже не хранится в браузере. Здесь доступны последние 6 работ.'); }
    onResultOpened?.();
  }, [ready, openResultId, history, onNotify, onResultOpened]);

  const patch = value => { setDraft(previous => ({ ...previous, ...value })); setError(''); };
  const chooseTemplate = id => { patch({ templateId: id }); setResult(null); };
  const showTemplates = () => {
    setView('templates'); setResult(null); setMobileStep(1);
    requestAnimationFrame(() => {
      if ((root.current?.clientWidth || window.innerWidth) < 824) {
        root.current?.scrollTo({ top: 0, behavior: 'instant' });
        stepHeading.current?.focus({ preventScroll: true });
      } else {
        gallery.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        gallery.current?.querySelector('button.trend-card')?.focus({ preventScroll: true });
      }
    });
  };
  const showSettings = () => {
    if (!template || disabled) return;
    setMobileStep(2);
    requestAnimationFrame(() => { root.current?.scrollTo({ top: 0, behavior: 'instant' }); stepHeading.current?.focus({ preventScroll: true }); });
  };
  const choosePhoto = async file => {
    if (!file || disabled) return;
    const invalid = validateCharacter(file);
    if (invalid) { setError(invalid); return; }
    const token = ++uploadJob.current;
    setStatus('uploading'); setError('');
    const url = URL.createObjectURL(file);
    try {
      const picture = await loadTrendImage(url);
      if (token !== uploadJob.current) return;
      if (picture.width < 128 || picture.height < 128) throw new Error('Выберите фото размером хотя бы 128 × 128 пикселей.');
      if (picture.width * picture.height > 48_000_000) throw new Error('Фото слишком большое. Уменьшите его до 48 мегапикселей.');
      patch({ character: { name: file.name, blob: file, width: picture.width, height: picture.height } });
      setPhotoRequired(false);
      setResult(null);
    } catch (failure) { if (token === uploadJob.current) setError(failure.message); }
    finally { URL.revokeObjectURL(url); if (token === uploadJob.current) setStatus('idle'); }
  };
  const generate = async () => {
    if (disabled) return;
    if (!draft.character?.blob) {
      setError('');
      setPhotoRequired(true);
      onNotify?.('Добавьте фото персонажа');
      upload.current?.parentElement.querySelector('.trend-source-main')?.focus();
      return;
    }
    const invalid = validateTrendDraft(draft);
    if (invalid) { setError(invalid); return; }
    if (disabled) return;
    const snapshot = { ...draft, character: { ...draft.character } };
    const controller = new AbortController();
    job.current = controller;
    setStatus('generating'); setProgress(0); setError(''); setResult(null);
    try {
      const video = await renderTrendVideo(snapshot, { signal: controller.signal, onProgress: setProgress });
      if (controller.signal.aborted) return;
      setHistory(previous => [video, ...previous].slice(0, 6)); setResult(routeActive.current ? video : null); setView('history'); setStatus('idle');
      root.current?.scrollTo({ top: 0, behavior: 'smooth' });
      onNotify?.('Видео готово'); onComplete?.(video);
    } catch (failure) {
      if (controller.signal.aborted) return;
      setStatus('error'); setError(failure.message || 'Не удалось создать видео. Попробуйте ещё раз.');
    } finally { if (job.current === controller) job.current = null; }
  };
  const cancel = () => { job.current?.abort(); job.current = null; setStatus('idle'); setProgress(0); };
  const closeResult = () => { setResult(null); setView('history'); };
  const filteredTemplates = TREND_TEMPLATES.filter(item => filter === 'all' || item.category === filter);
  const inFlow = !result && view === 'templates';

  return <section className={`trends-studio${inFlow ? ' studio-page--flow' : ''}`} ref={root} aria-label="Тренды">
    <div className="trends-inner">
      <header className="trends-heading"><div><h1>Тренды</h1><p>Ваш персонаж. Знакомое движение. Новая история.</p></div><Tabs label="Раздел трендов" value={view} onChange={next => { setView(next); setResult(null); }} disabled={busy} items={[{ id: 'templates', label: 'Шаблоны' }, { id: 'history', label: 'Мои видео', count: history.length || undefined }]}/></header>
      {storageError && <p className="trend-storage-note" role="status">{storageError}</p>}
      {inFlow && <div className="studio-mobile-steps">{mobileStep === 2 && <button type="button" onClick={showTemplates} disabled={disabled}><Icon name="arrowLeft" size={16}/><span>К выбору тренда</span></button>}<span ref={stepHeading} tabIndex={-1}>Шаг {mobileStep} из 2 · {mobileStep === 1 ? 'Выберите тренд' : 'Настройте видео'}</span></div>}
      {view === 'history' ? <section className="trend-history" aria-label="Мои видео">{history.length ? <><div className="trend-history-grid">{history.map(item => <SavedVideo key={item.id} result={item} onOpen={setResult}/>)}</div></> : <div className="trend-empty"><Icon name="play" size={30}/><h2>Здесь будут ваши видео</h2><p>Выберите движение, добавьте фото и создайте первое.</p><button className="trend-secondary" onClick={showTemplates}>Выбрать шаблон</button></div>}</section> : <div className={`trends-workspace studio-mobile-step-${mobileStep}`}>
        <form className="trend-form studio-settings-panel" onSubmit={event => { event.preventDefault(); generate(); }} aria-busy={busy}>
          <div className="studio-form-fields">
          <div className="trend-form-heading"><h2>Создайте своё видео</h2><span>9:16</span></div>
          <div className="trend-sources">
            <div className={`trend-source${template ? ' has-source' : ''}`}>
              <button type="button" disabled={disabled} className="trend-source-main" onClick={showTemplates} aria-label={template ? `Изменить движение: ${template.name}` : 'Выбрать движение'}>{template ? <><MotionPreview template={template} active={active && busy}/><span className="trend-source-label">{template.name}</span></> : <><span className="trend-source-icon"><Icon name="play" size={24}/></span><strong>Движение</strong><small>Выберите шаблон</small></>}</button>
              {template && <button type="button" className="trend-source-remove" disabled={disabled} onClick={() => patch({ templateId: '' })} aria-label="Убрать движение"><Icon name="close" size={12}/></button>}
              <span className="trend-source-step">01</span>
            </div>
            <div className={`trend-source${characterUrl ? ' has-source' : ''}${dragging ? ' is-dragging' : ''}${photoRequired ? ' is-invalid' : ''}`} onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); choosePhoto(event.dataTransfer.files[0]); }}>
              <button type="button" disabled={disabled} className="trend-source-main" onClick={() => upload.current?.click()} aria-invalid={photoRequired || undefined} aria-label={characterUrl ? 'Заменить фото персонажа' : 'Загрузить фото персонажа'}>{characterUrl ? <><img src={characterUrl} alt="Ваш персонаж"/><span className="trend-source-label">Ваш персонаж</span></> : <><span className="trend-source-icon"><Icon name="files" size={24}/></span><strong>{status === 'uploading' ? 'Загружаем…' : 'Персонаж'}</strong><small>Добавьте фото</small></>}</button>
              {characterUrl && <button type="button" className="trend-source-remove" disabled={disabled} onClick={() => { uploadJob.current++; patch({ character: null }); }} aria-label="Удалить фото персонажа"><Icon name="close" size={12}/></button>}
              <span className="trend-source-step">02</span><input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { const file = event.target.files[0]; event.target.value = ''; choosePhoto(file); }}/>
            </div>
          </div>
          <p className="trend-upload-hint">Фото JPG, PNG или WebP · до 15 МБ</p>
          <label className="trend-field-label" htmlFor="trend-caption">Подпись в видео <span>необязательно</span></label>
          <textarea id="trend-caption" className="trend-caption" placeholder="Ваша история в одной фразе…" value={draft.caption} maxLength={160} disabled={disabled} onChange={event => patch({ caption: event.target.value })} rows={3}/>
          <div className="trend-caption-hint"><span>Появится внизу кадра</span><span>{draft.caption.length}/160</span></div>
          <label className="trend-field-label" htmlFor="trend-quality">Качество</label>
          <Select id="trend-quality" aria-label="Качество видео" value={draft.quality} onChange={quality => patch({ quality })} disabled={disabled} options={[{ value: '720', label: '720p · Быстрее' }, { value: '1080', label: '1080p · Больше деталей' }]}/>
          <p className="trend-render-note">Движение камеры применяется к вашему фото. Позы и мимика персонажа сохраняются.</p>
          </div>
          <div className="studio-form-actions">
          {error && <p className="trend-error" role="alert">{error}</p>}
          {template && <span className="studio-selected-template">{template.name}</span>}
          <button type="submit" className={`trend-primary trend-generate-button${busy ? ' is-generating' : ''}`} disabled={disabled} title={busy ? undefined : `Примерная стоимость: ${costLabel} MC`}>{busy ? <><span className="trend-spinner" aria-hidden="true"/>Создаём видео · {progress}%</> : <>{status === 'error' ? <span>Попробовать ещё раз</span> : <><span className="studio-desktop-label">Сгенерировать видео</span><span className="studio-mobile-label">Начать генерацию</span></>}<span className="trend-generation-cost"><span className="trend-live">Примерная стоимость:</span><span>≈ {costLabel}</span><Icon name="balanceToken" size={14}/><span className="trend-live">MC</span></span></>}</button>
          {busy && <button type="button" className="trend-cancel" onClick={cancel}>Отменить</button>}
          <span className="trend-live" aria-live="polite">{busy ? 'Создаём видео. Это займёт около шести секунд.' : result ? 'Видео готово.' : ''}</span>
          </div>
        </form>
        <section className="trends-collection" ref={gallery} aria-label="Коллекция движений"><div className="trend-collection-toolbar"><Tabs label="Тип движения" value={filter} onChange={setFilter} disabled={busy} items={[{ id: 'all', label: 'Все' }, { id: 'camera', label: 'Камера' }, { id: 'motion', label: 'Движение кадра' }]}/><span>{filteredTemplates.length} шаблонов</span></div><div className="trend-template-grid">{filteredTemplates.map(item => <TrendCard active={active} key={item.id} template={item} selected={draft.templateId === item.id} onSelect={chooseTemplate} disabled={disabled}/>)}</div></section>
        <div className="studio-mobile-next">{template && <span className="studio-selected-template">{template.name}</span>}<button type="button" className="trend-primary" onClick={showSettings} disabled={!template || disabled}><span>Далее</span><Icon name="arrowRight" size={17}/></button></div>
      </div>}
    </div>
    {active && result && <TrendResultViewer key={result.id} result={result} onClose={closeResult}/>}
  </section>;
}
