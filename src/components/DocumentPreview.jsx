import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCw, FileWarning } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/TextLayer.css';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth/mammoth.browser';
import DOMPurify from 'dompurify';
import { documentFormat } from '../artifact-model.js';
import { readDocument } from '../document-storage.js';
pdfjs.GlobalWorkerOptions.workerSrc = worker;
const PDF_OPTIONS = { isEvalSupported: false, stopAtErrors: true };
const views = new Map();
const keyOf = file => file.id || file.url || file.name;
export default function DocumentPreview({ file, visible, onDownloadChange }) {
  const format = documentFormat(file), key = keyOf(file);
  const viewport = useRef(null), savedScroll = useRef(0), restoring = useRef(false);
  const [resource, setResource] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [pageRatios, setPageRatios] = useState({});
  const [pages, setPages] = useState(0), [page, setPage] = useState(1), [zoom, setZoom] = useState(1), [width, setWidth] = useState(400);
  const [renderError, setRenderError] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setWidth(entry.contentRect.width); });
    observer.observe(viewport.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const abort = new AbortController(); let url;
    const view = views.get(key) || { scroll:0, zoom:1 };
    savedScroll.current = view.scroll; restoring.current = true;
    onDownloadChange(null); setResource(null); setError(''); setRenderError(false); setPages(0); setPageRatios({}); setPage(1); setZoom(view.zoom);
    (async () => {
      const blob = await readDocument(file, abort.signal);
      if (blob.size > 25 * 1024 * 1024) throw new Error('Предпросмотр поддерживает документы до 25 МБ.');
      if (abort.signal.aborted) return;
      url = URL.createObjectURL(blob); onDownloadChange({key, url});
      let content;
      if (format === 'md') content = await blob.text();
      if (format === 'docx') {
        const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() }, { externalFileAccess:false, styleMap:["p[style-name='Title'] => h1:fresh"] });
        content = DOMPurify.sanitize(result.value, {
          ALLOWED_TAGS:['h1','h2','h3','h4','h5','h6','p','br','strong','em','u','s','ul','ol','li','table','thead','tbody','tr','th','td','blockquote','a','img','sup','sub'],
          ALLOWED_ATTR:['href','src','alt','colspan','rowspan'],
        });
        // Only embedded raster images; remote images and SVG cannot track or execute.
        const doc = new DOMParser().parseFromString(content, 'text/html');
        doc.querySelectorAll('img').forEach(img => { if (!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(img.getAttribute('src') || '')) img.remove(); });
        doc.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
        content = doc.body.innerHTML;
      }
      if (abort.signal.aborted) return;
      setResource({ key, url, content });
    })().catch(err => { if (!abort.signal.aborted) setError(/[а-яё]/i.test(err.message || '') ? err.message : 'Не удалось прочитать документ. Файл может быть повреждён или временно недоступен.'); });
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url); onDownloadChange(null); };
  }, [file, key, format, attempt, onDownloadChange]);
  const pdfFile = useMemo(() => resource?.url ? {url:resource.url} : null, [resource]);
  const restore = () => {
    if (!visible || !viewport.current || !restoring.current) return;
    viewport.current.scrollTop = savedScroll.current;
    if (Math.abs(viewport.current.scrollTop - savedScroll.current) < 2) restoring.current = false;
  };
  useLayoutEffect(() => { restoring.current = true; if (visible) restore(); }, [visible]);
  useLayoutEffect(() => { restore(); }, [resource, pages, visible]);
  const scroll = () => {
    if (visible && resource?.key === key && !restoring.current) { savedScroll.current = viewport.current.scrollTop; views.set(key, {scroll:savedScroll.current, zoom}); }
    const elements = [...viewport.current.querySelectorAll('[data-pdf-page]')];
    const top = viewport.current.getBoundingClientRect().top;
    const current = elements.find(el => el.getBoundingClientRect().bottom > top + 60);
    if (current) setPage(Number(current.dataset.pdfPage));
  };
  const changeZoom = delta => {
    const value = Math.max(.5, Math.min(2.5, Math.round((zoom + delta) * 100) / 100));
    setZoom(value); views.set(key, {scroll:savedScroll.current, zoom:value});
  };
  const failure = error || (renderError ? 'Не удалось прочитать PDF. Файл может быть повреждён или защищён паролем.' : '');
  return <>
    {format === 'pdf' && <div className="artifact-toolbar">
      <span aria-live="polite">{pages ? `${page} / ${pages}` : 'PDF'}</span>
      <div className="artifact-zoom"><button className="artifact-icon" aria-label="Уменьшить масштаб" disabled={zoom <= .5} onClick={() => changeZoom(-.1)}><Minus/></button><output aria-label="Масштаб">{Math.round(zoom * 100)}%</output><button className="artifact-icon" aria-label="Увеличить масштаб" disabled={zoom >= 2.5} onClick={() => changeZoom(.1)}><Plus/></button></div>
    </div>}
    <div ref={viewport} className="artifact-scroll" onScroll={scroll} onWheel={() => {restoring.current = false;}} onTouchStart={() => {restoring.current = false;}} tabIndex={0} aria-label="Содержимое документа">
      {failure ? <div className="artifact-state" role="alert"><FileWarning size={28}/><strong>Не удалось открыть документ</strong><p>{failure}</p><button className="artifact-retry" onClick={() => setAttempt(a => a + 1)}><RotateCw size={16}/>Повторить</button></div> : !resource || resource.key !== key ? <div className="artifact-state" role="status"><span className="artifact-spinner"/>Загружаем документ…</div> : format === 'pdf' ?
        <Document suspense={false} file={pdfFile} options={PDF_OPTIONS} onLoadSuccess={({numPages}) => setPages(numPages)} onLoadError={() => setRenderError(true)} onSourceError={() => setRenderError(true)} onPassword={() => setRenderError(true)} loading={<div className="artifact-state" role="status">Открываем PDF…</div>} error={null}>
          {Array.from({length:pages}, (_, index) => <div className="artifact-pdf-page" data-pdf-page={index + 1} key={index} style={{minHeight: Math.max(240, width - 40) * zoom * (pageRatios[index] || Math.SQRT2)}}><Page suspense={false} onLoadSuccess={pdfPage => { const size = pdfPage.getViewport({scale:1}); const ratio = size.height / size.width; setPageRatios(previous => previous[index] === ratio ? previous : {...previous, [index]:ratio}); }} pageNumber={index + 1} width={Math.max(240, width - 40)} scale={zoom} devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)} renderAnnotationLayer={false} loading={<div className="artifact-state" role="status">Загружаем страницу…</div>} onLoadError={() => setRenderError(true)} onRenderSuccess={restore} onRenderError={() => setRenderError(true)}/></div>)}
        </Document> : format === 'docx' ? <article className="artifact-document" dangerouslySetInnerHTML={{__html:resource.content}} onLoad={restore}/> :
        <article className="artifact-document"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{a:({node,...props}) => <a {...props} target="_blank" rel="noopener noreferrer"/>, img:({alt}) => <span>{alt || 'Изображение'}</span>}}>{resource.content}</Markdown></article>}
    </div>
  </>;
}
