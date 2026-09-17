import { useCallback, useEffect, useRef, useState } from 'react';
import { DownloadSimple, MusicNotes, Pause, Play, SkipBack, SkipForward, SpeakerHigh, SpeakerSlash, X } from '../outline-icons.jsx';
import './audio-player.css';

export function formatAudioTime(seconds) {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function AudioPlayer({ items = [], currentId, onSelect, onClose, inert = false }) {
  const queue = items.filter(item => item.type === 'audio' && item.src);
  const index = queue.findIndex(item => item.id === currentId);
  const current = queue[index];
  const audio = useRef(null);
  const playAttempt = useRef(0);
  const loopOffset = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const play = useCallback(async () => {
    const element = audio.current;
    if (!element) return;
    const attempt = ++playAttempt.current;
    if (element.error) { element.load(); setFailed(false); }
    setNotice('');
    setWaiting(true);
    try {
      await element.play();
      if (attempt === playAttempt.current) setWaiting(false);
    } catch (error) {
      if (attempt !== playAttempt.current || error.name === 'AbortError') return;
      setWaiting(false);
      setPlaying(false);
      setNotice(error.name === 'NotAllowedError' ? 'Нажмите «Воспроизвести», чтобы включить звук.' : 'Не удалось воспроизвести аудио. Попробуйте ещё раз.');
    }
  }, []);

  useEffect(() => {
    const element = audio.current;
    loopOffset.current = 0;
    setPosition(0);
    setDuration(current?.duration || 0);
    setPlaying(false);
    setFailed(false);
    setNotice('');
    setCoverFailed(false);
    if (!element || !current?.src) return;
    // Reload even when two queue entries use the same demonstration file.
    element.load();
    play();
    return () => { ++playAttempt.current; element.pause(); };
  }, [current?.id, current?.src, play]);

  useEffect(() => {
    if (audio.current) { audio.current.volume = volume; audio.current.muted = muted; }
  }, [volume, muted, current?.id]);

  useEffect(() => {
    const pauseForOtherMedia = event => {
      if (event.detail?.element && event.detail.element !== audio.current) {
        ++playAttempt.current;
        audio.current?.pause();
        setWaiting(false);
      }
    };
    const replaySelectedTrack = event => {
      if (!current || event.detail?.id !== current.id) return;
      const element = audio.current;
      if (element && (element.ended || (current.duration && loopOffset.current + element.currentTime >= current.duration))) {
        loopOffset.current = 0;
        element.currentTime = 0;
        setPosition(0);
      }
      play();
    };
    document.addEventListener('molecula-media-play', pauseForOtherMedia);
    document.addEventListener('molecula-audio-request', replaySelectedTrack);
    return () => {
      document.removeEventListener('molecula-media-play', pauseForOtherMedia);
      document.removeEventListener('molecula-audio-request', replaySelectedTrack);
    };
  }, [current?.id, current?.duration, play]);

  if (!current) return null;
  const seek = seconds => {
    if (!audio.current || !duration) return;
    try {
      const next = Math.max(0, Math.min(seconds, duration));
      const sourceDuration = audio.current.duration;
      if (!Number.isFinite(sourceDuration) || !sourceDuration) return;
      loopOffset.current = Math.floor(Math.min(next, Math.max(0, duration - .01)) / sourceDuration) * sourceDuration;
      audio.current.currentTime = Math.min(sourceDuration, next - loopOffset.current);
      setPosition(next);
    } catch { /* Metadata may be replaced while the user is dragging. */ }
  };
  const toggle = () => {
    if (playing || waiting) {
      ++playAttempt.current;
      audio.current?.pause();
      setWaiting(false);
    } else {
      if (failed) { setFailed(false); audio.current?.load(); }
      if (position >= duration || audio.current?.ended) seek(0);
      play();
    }
  };
  const previous = () => {
    if (position > 3 || index === 0) seek(0);
    else onSelect?.(queue[index - 1].id);
  };
  const title = current.title || 'Тёплый свет';
  const extension = /\.([a-z\d]{2,5})(?:[?#]|$)/i.exec(current.src)?.[1] || 'wav';
  const downloadName = `${title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'Аудио'}.${extension}`;
  return <aside className="audio-player" aria-label="Музыкальный плеер" data-playing={playing || undefined} inert={inert} aria-hidden={inert || undefined}>
    <audio ref={audio} src={current.src} data-media-id={current.id} preload="metadata"
      onLoadedMetadata={event => setDuration(current.duration || (Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0))}
      onDurationChange={event => setDuration(current.duration || (Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0))}
      onTimeUpdate={event => {
        const next = loopOffset.current + event.currentTarget.currentTime;
        if (current.duration && next >= current.duration) { event.currentTarget.pause(); setPosition(current.duration); if (index < queue.length - 1) onSelect?.(queue[index + 1].id); }
        else setPosition(next);
      }}
      onPlay={event => {
        setPlaying(true); setNotice(''); setFailed(false);
        document.dispatchEvent(new CustomEvent('molecula-media-play', { detail: { element: event.currentTarget } }));
      }}
      onPlaying={() => setWaiting(false)}
      onPause={() => { setPlaying(false); setWaiting(false); }}
      onWaiting={event => { if (!event.currentTarget.paused) setWaiting(true); }}
      onCanPlay={() => setWaiting(false)}
      onEnded={() => {
        const element = audio.current;
        const next = loopOffset.current + element.duration;
        if (current.duration && next < current.duration - .05) { loopOffset.current = next; element.currentTime = 0; play(); }
        else { setPlaying(false); setWaiting(false); if (index < queue.length - 1) onSelect?.(queue[index + 1].id); }
      }}
      onError={() => { setPlaying(false); setWaiting(false); setFailed(true); setNotice('Не удалось загрузить аудио. Нажмите «Воспроизвести», чтобы повторить.'); }}
    />
    <div className="audio-player-identity">
      <span className="audio-player-art">{!coverFailed ? <img src={current.poster || '/media/artwork/orange-bloom.jpg'} alt="" onError={() => setCoverFailed(true)} /> : <MusicNotes size={24} />}</span>
      <div className="audio-player-copy"><strong title={title}>{title}</strong><span><span>{current.model || 'Инструментальная композиция'}</span></span></div>
    </div>
    <div className="audio-player-transport">
      <div className="audio-player-buttons">
        <button type="button" className="audio-player-button" aria-label="Предыдущий трек" disabled={index === 0 && position === 0} onClick={previous}><SkipBack size={18} weight="fill" /></button>
        <button type="button" className="audio-player-button audio-player-play" aria-label={playing || waiting ? 'Приостановить' : 'Воспроизвести'} aria-busy={waiting} onClick={toggle}>{playing || waiting ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}</button>
        <button type="button" className="audio-player-button" aria-label="Следующий трек" disabled={index >= queue.length - 1} onClick={() => onSelect?.(queue[index + 1].id)}><SkipForward size={18} weight="fill" /></button>
      </div>
      <div className="audio-player-timeline"><span>{formatAudioTime(position)}</span><input className="audio-player-range" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 0)} disabled={!duration || failed} onChange={event => seek(Number(event.target.value))} aria-label="Позиция трека" aria-valuetext={`${formatAudioTime(position)} из ${formatAudioTime(duration)}`} style={{ '--audio-fill': `${duration ? Math.min(100, position / duration * 100) : 0}%` }} /><span>{formatAudioTime(duration)}</span></div>
    </div>
    <div className="audio-player-tools">
      <div className="audio-player-volume"><button type="button" className="audio-player-button" aria-label={muted || volume === 0 ? 'Включить звук' : 'Выключить звук'} aria-pressed={muted || volume === 0} onClick={() => { if (volume === 0) setVolume(0.7); setMuted(value => volume === 0 ? false : !value); }}>{muted || volume === 0 ? <SpeakerSlash size={19} /> : <SpeakerHigh size={19} />}</button><input className="audio-player-range" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={event => { setVolume(Number(event.target.value)); setMuted(false); }} aria-label="Громкость" aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`} style={{ '--audio-fill': `${(muted ? 0 : volume) * 100}%` }} /></div>
      <a className="audio-player-button" href={current.src} download={downloadName} aria-label="Скачать аудио"><DownloadSimple size={19} /></a>
    </div>
    <button type="button" className="audio-player-button audio-player-close" aria-label="Закрыть плеер" onClick={() => { ++playAttempt.current; audio.current?.pause(); onClose?.(); }}><X size={18} /></button>
    {notice && <p className="audio-player-notice" role="status">{notice}</p>}
  </aside>;
}
