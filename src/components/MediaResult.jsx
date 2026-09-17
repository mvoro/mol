import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { Icon } from '../ui.jsx';
import './media-result.css';
import { ratioValue } from '../generation-request.js';

const GenerationEffect = lazy(() => import('./GenerationEffect.jsx'));
class EffectBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function MediaResult({ media, pending, onOpen }) {
  const variants = media.variants?.length ? media.variants : [media];
  return <div className={`media-result-group${variants.length > 1 ? ' has-variants' : ''}`}>{variants.map((item, index) => {
    const result = { ...item, ready: media.ready, id: index === 0 ? media.id : `${media.id}-${index}` };
    return <SingleMediaResult key={result.id || index} media={result} pending={pending} onOpen={onOpen} />;
  })}</div>;
}
function SingleMediaResult({ media, pending, onOpen }) {
  const [revealing, setRevealing] = useState(pending);
  const [loadFailed, setLoadFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!pending && revealing) {
      // The library's reveal lasts 3s; completion comes from onCycle, with a
      // longer watchdog only for unavailable WebGL/images or a background tab.
      const timer = setTimeout(() => setRevealing(false), media.ready && !reduceMotion ? 12000 : 0);
      return () => clearTimeout(timer);
    }
  }, [pending, media.ready, revealing, reduceMotion]);
  const interrupted = !pending && !media.ready;
  const effectVisible = !reduceMotion && !interrupted && !loadFailed && (pending || revealing);
  return <figure className={`media-result media-result--${media.type}`} aria-busy={pending} aria-label={media.type === "video" ? "Результат видео" : "Результат изображения"}>
    <div className="media-result-surface" style={{ aspectRatio: ratioValue(media.ratio, media.type === "video" ? 16 / 9 : 4 / 3) }}>
      {media.ready && !loadFailed && <button className="media-result-preview" onClick={() => onOpen?.(media)} disabled={!onOpen} aria-label={media.type === 'video' ? 'Открыть видео' : 'Открыть изображение'}>
        <img key={imageAttempt} src={media.poster || media.src} alt={media.title || 'Результат генерации'} onError={() => setLoadFailed(true)} />
        {media.type === 'video' && <span className="media-result-play"><Icon name="play" size={22}/></span>}
      </button>}
      {effectVisible && <div className="generation-effect" aria-hidden="true"><EffectBoundary><Suspense fallback={null}><GenerationEffect poster={media.poster || media.src} ready={media.ready} onRevealed={() => setRevealing(false)} /></Suspense></EffectBoundary></div>}
      {pending && <span className="media-result-status" role="status">{media.type === 'video' ? 'Генерируется видео' : 'Генерируется изображение'}</span>}
      {interrupted && <div className="generation-label" role="status"><span>Генерация остановлена</span><small>Можно отправить запрос ещё раз</small></div>}
      {loadFailed && <div className="generation-label" role="status"><span>Не удалось загрузить превью</span><button className="pill" onClick={() => { setImageAttempt(value => value + 1); setLoadFailed(false); }}>Повторить загрузку</button></div>}
    </div>

  </figure>;
}
