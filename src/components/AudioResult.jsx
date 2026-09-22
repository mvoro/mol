import { withBasePath } from '../base-path.js';
import { useState } from 'react';
import { Music2, Play } from 'lucide-react';
import './audio-result.css';

const WAVE_HEIGHTS = [9, 14, 22, 16, 29, 35, 23, 39, 31, 19, 26, 40, 33, 22, 14, 28, 36, 24, 41, 30, 18, 25, 34, 22, 15, 29, 38, 27, 18, 12, 22, 30, 21, 14, 8, 16, 25, 18, 12, 7];

export function AudioResult({ media, pending = false, onPlay }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const ready = Boolean(media.ready) && !pending;
  const title = media.title || 'Тёплый свет';
  return <figure className="audio-result" aria-busy={pending}>
    <div className="audio-result-track">
      <div className="audio-result-cover">
        {!coverFailed ? <img src={withBasePath(media.poster || '/media/artwork/orange-bloom.jpg')} alt="" onError={() => setCoverFailed(true)} /> : <Music2 size={30} strokeWidth={1.75} aria-hidden="true"/>}
        {ready && <button type="button" className="audio-result-play" aria-label={`Воспроизвести «${title}»`} disabled={!onPlay} onClick={() => {
          onPlay?.(media);
          document.dispatchEvent(new CustomEvent('molecula-audio-request', { detail: { id: media.id } }));
        }}><Play size={20} fill="currentColor" strokeWidth={1.75} aria-hidden="true"/></button>}
      </div>
      <div className="audio-result-copy"><div className="audio-result-heading"><strong title={title}>{title}</strong></div><span className="audio-result-model">{media.model || 'Инструментальная композиция'}</span><div className={`audio-result-wave${pending ? ' is-pending' : ''}`} aria-hidden="true">{WAVE_HEIGHTS.map((height, index) => <i key={index} style={{ height: `${height}px`, '--wave-delay': `${index * 32}ms` }} />)}</div></div>
    </div>
    {pending && <span className="media-result-status" role="status">Генерируется аудио</span>}
    {!pending && !ready && <figcaption role="status">Генерация остановлена. Можно отправить запрос ещё раз.</figcaption>}
  </figure>;
}
