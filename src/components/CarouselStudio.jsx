import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui.jsx';
import { Select } from './Select.jsx';
import { TextInput } from './TextInput.jsx';
import { Tabs } from './Tabs.jsx';
import { CAROUSEL_FORMATS, CAROUSEL_STORAGE_KEY, CAROUSEL_TEMPLATES, carouselFileName, carouselSlideCount, createCarouselResult, readCarouselState, resolveCarouselStyle, snapshotCarouselRequest, upsertCarouselResult, validateCarouselDraft } from '../carousel-model.js';
import { downloadCarousel, renderCarousel, renderCarouselSlide } from '../carousel-export.js';
import { MAX_CAROUSEL_REFERENCES, readCarouselReference, saveCarouselReference, validateCarouselReferenceFiles } from '../carousel-references.js';
import { estimateCarouselCost, formatGenerationCost } from '../generation-cost.js';
import './carousel-studio.css';
import './studio-flow.css';

const GenerationEffect = lazy(() => import('./GenerationEffect.jsx'));
const MediaViewer = lazy(() => import('./MediaViewer.jsx').then(module => ({ default: module.MediaViewer })));
const countOptions = Array.from({ length: 8 }, (_, index) => ({ value: index + 3, label: carouselSlideCount(index + 3) }));
class CarouselEffectBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function PendingCarousel({ image }) {
  return <div className="carousel-generation-effect" aria-hidden="true"><CarouselEffectBoundary><Suspense fallback={null}><GenerationEffect poster={image} ready={false} onRevealed={() => {}}/></Suspense></CarouselEffectBoundary></div>;
}

function StyleCover({ template, title, className = '', count, format = '4:5' }) {
  return <span className={`carousel-style-cover carousel-style-cover--${template.id}${template.font === 'Georgia' ? '' : ' carousel-style-cover--sans'} ${className}`} style={{ '--slide-background': template.background, '--slide-ink': template.ink, aspectRatio: format.replace(':', ' / ') }} aria-hidden="true">
    {template.image && <img src={template.image} alt="" loading="lazy" decoding="async" />}
    <span className="carousel-cover-kicker">{template.eyebrow}</span>
    <strong>{title || template.title}</strong>
    <span className="carousel-cover-footer"><span>01 / {String(count || 5).padStart(2, '0')}</span><Icon name="arrowRight" size={16}/></span>
  </span>;
}

function ReferenceThumbnail({ reference, onRemove, disabled }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    let active = true;
    let url = '';
    readCarouselReference(reference.id).then(blob => {
      if (!active || !blob) return;
      url = URL.createObjectURL(blob);
      setPreview(url);
    }).catch(() => {});
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [reference.id]);
  return <li className="carousel-reference-thumb">
    {preview ? <img src={preview} alt={reference.name}/> : <span className="carousel-reference-placeholder"><Icon name="files" size={20}/></span>}
    <button type="button" onClick={onRemove} disabled={disabled} aria-label={`Удалить референс ${reference.name}`}><Icon name="close" size={12}/></button>
    <span title={reference.name}>{reference.name}</span>
  </li>;
}

function SavedCarouselCard({ result, suppliedCover, onOpen, disabled }) {
  const card = useRef(null);
  const [cover, setCover] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (suppliedCover) return;
    const controller = new AbortController();
    let url = '';
    let started = false;
    setCover('');
    setFailed(false);
    const prepareCover = async () => {
      if (started) return;
      started = true;
      try {
        const blob = await renderCarouselSlide(result, 0, { signal: controller.signal });
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setCover(url);
      } catch { if (!controller.signal.aborted) setFailed(true); }
    };
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); prepareCover(); }
    }, { rootMargin: '200px' }) : null;
    if (observer && card.current) observer.observe(card.current);
    else prepareCover();
    return () => { controller.abort(); observer?.disconnect(); if (url) URL.revokeObjectURL(url); };
  }, [result, suppliedCover]);
  const image = suppliedCover || cover;
  const title = result.slides[0]?.title || result.request.topic;
  return <button ref={card} type="button" className="carousel-saved-card" onClick={() => onOpen(result)} disabled={disabled} aria-label={`Открыть карусель: ${title}`}>
    <span className="carousel-saved-cover" style={{ background: resolveCarouselStyle(result.request).background }} aria-busy={!image && !failed}>
      {image ? <img src={image} alt=""/> : <span className="carousel-saved-placeholder"><Icon name="carousel" size={28}/><small>{failed ? 'Обложка недоступна' : 'Подготовка обложки…'}</small></span>}
      <span className="carousel-saved-count"><Icon name="carousel" size={13}/>{result.slides.length}</span>
    </span>
    <span className="carousel-saved-title">{title}</span>
    <span className="carousel-saved-meta">{carouselSlideCount(result.slides.length)}<span>·</span>{result.request.format}</span>
  </button>;
}

export function CarouselStudio({ active = true, onNotify, onComplete, openResultId, onResultOpened }) {
  const [initial] = useState(() => readCarouselState(localStorage));
  const [draft, setDraft] = useState(initial.draft);
  const [result, setResult] = useState(initial.result);
  const [results, setResults] = useState(initial.results);
  const [stage, setStage] = useState(initial.stage);
  const [view, setView] = useState(initial.stage === 'result' ? 'history' : 'templates');
  const [setupStep, setSetupStep] = useState(initial.setupStep);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [blobs, setBlobs] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [referenceError, setReferenceError] = useState('');
  const referenceInput = useRef(null);
  const styleInput = useRef(null);
  const referencesBusy = useRef(false);
  const urls = useRef([]);
  const generation = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const renderedResult = useRef(null);
  const persistedWarning = useRef(false);
  const topicInput = useRef(null);
  const audienceInput = useRef(null);
  const heading = useRef(null);
  const scrollContainer = useRef(null);
  const brief = useRef(null);
  const stepLabel = useRef(null);
  const notification = useRef(onNotify);
  notification.current = onNotify;
  const template = resolveCarouselStyle(draft);
  const isCustom = draft.template === 'custom';
  const references = draft.references || [];
  const controlsDisabled = generating || uploading;
  const costLabel = formatGenerationCost(estimateCarouselCost(draft));
  const savedResults = upsertCarouselResult(results, result);

  useEffect(() => {
    try {
      const archive = upsertCarouselResult(results, result);
      localStorage.setItem(CAROUSEL_STORAGE_KEY, JSON.stringify({ draft, result, results: archive, stage, setupStep, selected: 0 }));
    } catch {
      if (!persistedWarning.current) { persistedWarning.current = true; notification.current?.('Не удалось сохранить карусель в браузере. Скачайте готовые слайды перед закрытием.'); }
    }
  }, [draft, result, results, stage, setupStep]);

  useEffect(() => {
    if (!openResultId) return;
    const found = result?.id === openResultId ? result : results.find(item => item.id === openResultId);
    if (found) { setResults(current => upsertCarouselResult(current, result)); setResult(found); setError(''); setRenderAttempt(current => current + 1); setStage('result'); setView('history'); requestAnimationFrame(() => { if (scrollContainer.current) scrollContainer.current.scrollTop = 0; }); }
    else notification.current?.('Эта карусель больше не хранится в браузере.');
    onResultOpened?.();
  }, [openResultId]);

  useEffect(() => { if (scrollContainer.current) scrollContainer.current.scrollTop = 0; }, [stage, view, setupStep]);
  useEffect(() => { if (!active) setStage('setup'); }, [active]);

  const replacePreviews = (nextBlobs, nextResult) => {
    const nextUrls = nextBlobs.map(blob => URL.createObjectURL(blob));
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = nextUrls;
    renderedResult.current = nextResult;
    setBlobs(nextBlobs);
    setPreviews(nextUrls);
  };

  useEffect(() => {
    if (!result || renderedResult.current === result) return;
    const controller = new AbortController();
    setPreparing(true);
    const timeout = setTimeout(async () => {
      try {
        const next = await renderCarousel(result, { signal: controller.signal });
        if (!controller.signal.aborted) { replacePreviews(next, result); setError(''); }
      } catch (reason) { if (!controller.signal.aborted) setError(reason.message || 'Не удалось подготовить слайды. Попробуйте ещё раз.'); }
      finally { if (!controller.signal.aborted) setPreparing(false); }
    }, 180);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [result, renderAttempt]);

  useEffect(() => () => {
    generation.current?.abort();
    generation.current = null;
    for (const url of urls.current) URL.revokeObjectURL(url);
  }, []);

  const updateDraft = (key, value) => {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  };

  const generate = async (source = draft) => {
    const validation = validateCarouselDraft(source);
    if (Object.keys(validation).length) {
      setErrors(validation);
      if (validation.styleDescription) styleInput.current?.focus();
      else if (validation.topic) topicInput.current?.focus();
      else if (validation.audience) audienceInput.current?.focus();
      return;
    }
    generation.current?.abort();
    const controller = new AbortController();
    generation.current = controller;
    const request = snapshotCarouselRequest(source);
    setGenerating(true); setError(''); setErrors({});
    try {
      const identity = { id: `carousel-${crypto.randomUUID()}` };
      const nextResult = createCarouselResult(request, identity);
      const nextBlobs = await renderCarousel(nextResult, { signal: controller.signal });
      if (controller.signal.aborted) return;
      replacePreviews(nextBlobs, nextResult);
      setResult(nextResult); setStage(activeRef.current ? 'result' : 'setup'); setView('history'); setPreparing(false);
      setResults(current => upsertCarouselResult(upsertCarouselResult(current, result), nextResult));
      onComplete?.({ id: nextResult.id, title: nextResult.slides[0].title, type: 'carousel', count: request.count, format: request.format, createdAt: nextResult.createdAt });
      requestAnimationFrame(() => { if (scrollContainer.current) scrollContainer.current.scrollTop = 0; });
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason.message || 'Не удалось создать карусель. Попробуйте ещё раз.');
    } finally {
      if (generation.current === controller) { generation.current = null; setGenerating(false); }
    }
  };

  const cancel = () => {
    generation.current?.abort();
    generation.current = null;
    setGenerating(false);
    notification.current?.('Генерация отменена. Настройки сохранены.');
  };

  const ready = result && renderedResult.current === result && blobs.length === result.slides.length && !preparing && !generating;
  const resultPreviews = renderedResult.current?.id === result?.id ? previews : [];
  const viewerItems = result && resultPreviews.length === result.slides.length ? result.slides.map((slide, index) => ({ id: slide.id, type: 'image', src: resultPreviews[index], title: [slide.title, slide.body].filter(Boolean).join('\n\n'), ratio: result.request.format, filename: carouselFileName(result, index), label: 'Карусель', details: `${carouselSlideCount(result.slides.length)} · ${result.request.format}` })) : [];
  const downloadAll = async () => {
    if (!ready) throw new Error('Дождитесь подготовки всех слайдов.');
    await downloadCarousel(result, blobs);
  };

  const closeViewer = () => {
    setStage('setup'); setView('history');
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };

  const changeView = next => {
    setResults(current => upsertCarouselResult(current, result));
    setView(next);
    setStage('setup');
    setError('');
  };

  const openSavedResult = saved => {
    setResults(current => upsertCarouselResult(current, result));
    setResult(saved); setView('history'); setStage('result'); setError(''); setRenderAttempt(current => current + 1);
  };

  const goToStep = step => {
    setSetupStep(step);
    requestAnimationFrame(() => stepLabel.current?.focus({ preventScroll: true }));
  };

  const addReferences = async files => {
    const incoming = Array.from(files || []);
    if (!incoming.length || referencesBusy.current || generating) return;
    const validation = validateCarouselReferenceFiles(incoming, references.length);
    if (validation) { setReferenceError(validation); return; }
    referencesBusy.current = true;
    setUploading(true);
    setReferenceError('');
    try {
      const added = [];
      for (const file of incoming) added.push(await saveCarouselReference(file));
      setDraft(current => ({ ...current, references: [...(current.references || []), ...added] }));
      setErrors(current => ({ ...current, references: undefined }));
    } catch (reason) {
      setReferenceError(reason.message || 'Не удалось прикрепить фото. Попробуйте ещё раз.');
    } finally {
      referencesBusy.current = false;
      setUploading(false);
    }
  };

  const chooseStyle = value => {
    updateDraft('template', value);
    setReferenceError('');
  };

  return <section className={`carousel-studio${stage === 'setup' && view === 'templates' ? ' studio-page--flow' : ''}`} ref={scrollContainer} aria-labelledby="carousel-title">
    <div className="carousel-studio-inner">
      <header className="carousel-heading">
        <div><h1 id="carousel-title" ref={heading} tabIndex={-1}>Карусель</h1><p>Одна идея — целая история. В вашем стиле.</p></div>
        <Tabs label="Раздел каруселей" value={view} onChange={changeView} disabled={controlsDisabled} items={[{ id: 'templates', label: 'Шаблоны' }, { id: 'history', label: 'Мои карусели', count: savedResults.length || undefined }]}/>
      </header>

      {view === 'history' ? <section className="carousel-history" aria-label="Мои карусели">
        {savedResults.length ? <><div className="carousel-history-grid">{savedResults.map(item => <SavedCarouselCard key={item.id} result={item} suppliedCover={item === result && ready ? previews[0] : undefined} onOpen={openSavedResult} disabled={controlsDisabled}/>)}</div></> : <div className="carousel-history-empty"><Icon name="carousel" size={32}/><h2>Здесь будут ваши карусели</h2><p>Выберите стиль, добавьте свою идею и создайте первую историю.</p><button type="button" className="carousel-soft-button" onClick={() => { changeView('templates'); goToStep(1); }}>Выбрать шаблон</button></div>}
      </section> : <>
        <div className="studio-mobile-steps">{setupStep === 2 && <button type="button" className="carousel-round-button" aria-label="Назад к выбору стиля" onClick={() => goToStep(1)} disabled={controlsDisabled}><Icon name="arrowLeft" size={18}/></button>}<span ref={stepLabel} tabIndex={-1}>Шаг {setupStep} из 2 · {setupStep === 1 ? 'Выберите стиль' : 'Настройки карусели'}</span></div>
        <div className={`carousel-workspace studio-mobile-step-${setupStep}`}>
        <form ref={brief} className="carousel-brief studio-settings-panel" noValidate onSubmit={event => { event.preventDefault(); if (!controlsDisabled) generate(); }} aria-busy={controlsDisabled}>
          <div className="studio-form-fields">
          <div className="carousel-section-heading"><h2>Ваша карусель</h2><span>{carouselSlideCount(draft.count)}</span></div>
          <div className="carousel-selected-style">
            {template.image ? <img src={template.image} alt=""/> : <span className="carousel-selected-custom"><Icon name="edit" size={23}/></span>}
            <span><small>{isCustom ? 'Без готового шаблона' : 'Выбранный стиль'}</small><strong>{template.name}</strong></span>
          </div>
          {isCustom && <>
            <div className="carousel-field">
              <label htmlFor="carousel-style-description">Опишите свой стиль</label>
              <textarea id="carousel-style-description" ref={styleInput} value={draft.styleDescription || ''} onChange={event => updateDraft('styleDescription', event.target.value)} placeholder="Например: минимализм, тёплый бежевый фон, крупные заголовки и журнальная типографика" maxLength={1200} rows={4} disabled={controlsDisabled} aria-invalid={!!errors.styleDescription} aria-describedby={errors.styleDescription ? 'carousel-style-error' : undefined}/>
              {errors.styleDescription && <small id="carousel-style-error" className="carousel-field-error">{errors.styleDescription}</small>}
            </div>
            <div className="carousel-field carousel-reference-field">
              <label htmlFor="carousel-references">Фото-референсы <span>{references.length} / {MAX_CAROUSEL_REFERENCES}</span></label>
              <input id="carousel-references" className="carousel-sr-only" ref={referenceInput} type="file" accept="image/jpeg,image/png,image/webp" multiple tabIndex={-1} disabled={controlsDisabled || references.length >= MAX_CAROUSEL_REFERENCES} onChange={event => { addReferences(event.target.files); event.target.value = ''; }}/>
              <button type="button" className={`carousel-reference-upload${dragging ? ' is-dragging' : ''}`} onClick={() => referenceInput.current?.click()} disabled={controlsDisabled || references.length >= MAX_CAROUSEL_REFERENCES} onDragOver={event => { event.preventDefault(); if (!controlsDisabled) setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); if (!controlsDisabled) addReferences(event.dataTransfer.files); }} aria-describedby="carousel-references-hint">
                <Icon name="attach" size={18}/><span>{uploading ? 'Прикрепляем фото…' : references.length >= MAX_CAROUSEL_REFERENCES ? 'Прикреплено 5 фото' : 'Прикрепить фото'}</span>
              </button>
              <small id="carousel-references-hint" className="carousel-reference-hint">Необязательно · JPG, PNG, WebP · до 15 МБ</small>
              {references.length > 0 && <ul className="carousel-reference-list" aria-label="Прикреплённые фото-референсы">{references.map(reference => <ReferenceThumbnail key={reference.id} reference={reference} disabled={controlsDisabled} onRemove={() => { updateDraft('references', references.filter(item => item.id !== reference.id)); setReferenceError(''); }}/>)}</ul>}
              {(referenceError || errors.references) && <small className="carousel-field-error" role="alert">{referenceError || errors.references}</small>}
            </div>
          </>}
          <div className="carousel-field">
            <label htmlFor="carousel-topic">Тема или готовый текст</label>
            <textarea id="carousel-topic" ref={topicInput} value={draft.topic} onChange={event => updateDraft('topic', event.target.value)} placeholder="Например, 5 способов находить идеи для контента. Или вставьте готовый текст…" maxLength={2400} rows={4} disabled={controlsDisabled} aria-invalid={!!errors.topic} aria-describedby={errors.topic ? 'carousel-topic-error' : 'carousel-topic-hint'}/>
            {errors.topic ? <small id="carousel-topic-error" className="carousel-field-error">{errors.topic}</small> : <div className="carousel-field-hint" id="carousel-topic-hint"><span>Разложим текст по слайдам</span><span>{draft.topic.length}/2400</span></div>}
          </div>
          <div className="carousel-field">
            <label htmlFor="carousel-audience">Для кого эта карусель</label>
            <TextInput id="carousel-audience" ref={audienceInput} value={draft.audience} onChange={event => updateDraft('audience', event.target.value)} placeholder="Например, начинающие авторы" maxLength={160} disabled={controlsDisabled} aria-invalid={!!errors.audience} aria-describedby={errors.audience ? 'carousel-audience-error' : undefined}/>
            {errors.audience && <small id="carousel-audience-error" className="carousel-field-error">{errors.audience}</small>}
          </div>
          <div className="carousel-format-fields">
            <div className="carousel-field"><label htmlFor="carousel-count">Слайды</label><Select id="carousel-count" value={draft.count} onChange={value => updateDraft('count', value)} options={countOptions} disabled={controlsDisabled}/></div>
            <div className="carousel-field"><label htmlFor="carousel-format">Формат</label><Select id="carousel-format" value={draft.format} onChange={value => updateDraft('format', value)} options={CAROUSEL_FORMATS.map(item => ({ ...item, label: item.value }))} disabled={controlsDisabled}/></div>
          </div>
          {error && <div className="carousel-error" role="alert"><Icon name="info" size={18}/><span>{error}</span></div>}
          </div>
          <div className="carousel-form-actions studio-form-actions"><span className="studio-selected-template">{template.name}</span><button type="submit" className="carousel-primary-button carousel-generate-button" disabled={controlsDisabled} aria-label={generating ? 'Генерация карусели' : `Начать генерацию — примерно ${costLabel} MC`} title={generating ? undefined : `Примерная стоимость: ${costLabel} MC`}><span>{generating ? 'Генерация…' : <><span className="studio-desktop-label">Сгенерировать</span><span className="studio-mobile-label">Начать генерацию</span></>}</span>{generating ? <Icon name="stop" size={18}/> : <span className="carousel-generation-cost" aria-hidden="true"><span>≈ {costLabel}</span><Icon name="balanceToken" size={14}/></span>}</button>{generating && <button type="button" className="carousel-soft-button" onClick={cancel}>Отменить</button>}</div>
        </form>
        <section className="carousel-styles" aria-labelledby="carousel-style-title">
          <div className="carousel-section-heading"><h2 id="carousel-style-title">Выберите стиль</h2><span>Референсы для вашей истории</span></div>
          <div className="carousel-style-grid" role="group" aria-label="Стили карусели">
            <button type="button" className={`carousel-style-option carousel-custom-option${isCustom ? ' is-selected' : ''}`} aria-pressed={isCustom} aria-label="Свой стиль. Без готового шаблона: ваше описание и фото-референсы" onClick={() => chooseStyle('custom')} disabled={controlsDisabled}>
              <span className="carousel-style-frame"><span className="carousel-custom-cover" aria-hidden="true"><span className="carousel-custom-icon"><Icon name="add" size={28}/></span><strong>Ваш стиль.<br/>Ваши правила.</strong><small>Начните с чистого листа</small></span><span className="carousel-style-check"><Icon name="check" size={13}/></span></span>
              <span className="carousel-style-meta"><strong>Свой стиль</strong><small>Описание и до 5 фото-референсов</small></span>
            </button>
            {CAROUSEL_TEMPLATES.map(item => <button key={item.id} type="button" className={`carousel-style-option${draft.template === item.id ? ' is-selected' : ''}`} aria-pressed={draft.template === item.id} aria-label={`${item.name}. ${item.description}`} onClick={() => chooseStyle(item.id)} disabled={controlsDisabled}>
              <span className="carousel-style-frame"><StyleCover template={item}/><span className="carousel-style-check"><Icon name="check" size={13}/></span>{generating && draft.template === item.id && <PendingCarousel image={item.image}/>}</span>
              <span className="carousel-style-meta"><strong>{item.name}</strong><small>{item.description}</small></span>
            </button>)}
          </div>
          
        </section>
        <div className="studio-mobile-next"><span className="studio-selected-template">{template.name}</span><button type="button" className="carousel-primary-button" onClick={() => goToStep(2)} disabled={controlsDisabled}><span>Далее</span><Icon name="arrowRight" size={17}/></button></div>
      </div></>}
    </div>
    {active && stage === 'result' && result && <Suspense fallback={null}><MediaViewer key={result.id} items={viewerItems} initialId={result.slides[0]?.id} onClose={closeViewer} loading={!ready && !error} error={error} onRetry={() => { setError(''); setRenderAttempt(current => current + 1); }} onDownloadAll={downloadAll}/></Suspense>}
  </section>;
}
