import React, { useEffect, useRef, useState } from "react";
import { Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Icon } from "../ui.jsx";
import "./video-player.css";
import { ratioValue } from "../generation-request.js";

export function formatMediaTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

const PLAYER_ICONS = { pause: Pause, volume: Volume2, muted: VolumeX, expand: Maximize, collapse: Minimize };
function PlayerIcon({ name, size = 18 }) {
  const Glyph = PLAYER_ICONS[name];
  return Glyph ? <Glyph size={size} strokeWidth={1.75} aria-hidden="true" /> : <Icon name={name} size={size} />;
}

export function VideoPlayer({ src, poster, title = "Видео", ratio, requestedDuration, sound = true }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const loopOffset = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(!sound);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [aspect, setAspect] = useState(ratioValue(ratio, 16 / 9));

  useEffect(() => {
    const video = videoRef.current;
    const pauseForOther = (event) => {
      if (event.detail?.element !== video) video.pause();
    };
    const onFullscreen = () =>
      setFullscreen(document.fullscreenElement === playerRef.current);
    const onVisibility = () => {
      if (document.hidden) video.pause();
    };
    document.addEventListener("molecula-media-play", pauseForOther);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      video.pause();
      document.removeEventListener("molecula-media-play", pauseForOther);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    loopOffset.current = 0;
    setPosition(0);
    setDuration(requestedDuration || 0);
    setAspect(ratioValue(ratio, 16 / 9));
    if (videoRef.current) videoRef.current.muted = !sound;
    setPlaying(false);
    setEnded(false);
    setError("");
    setNotice("");
  }, [src, ratio, requestedDuration, sound]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggle = async () => {
    const video = videoRef.current;
    if (!video || error) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    if (video.ended || ended) { loopOffset.current = 0; video.currentTime = 0; setPosition(0); }
    try {
      await video.play();
    } catch {
      setError("Не удалось запустить видео. Попробуйте еще раз.");
    }
  };
  const seek = (value) => {
    if (!duration || !Number.isFinite(value)) return;
    const next = Math.min(duration, Math.max(0, value));
    const sourceDuration = videoRef.current.duration;
    if (!Number.isFinite(sourceDuration) || !sourceDuration) return;
    loopOffset.current = Math.floor(Math.min(next, Math.max(0, duration - .01)) / sourceDuration) * sourceDuration;
    videoRef.current.currentTime = Math.min(sourceDuration, next - loopOffset.current);
    setPosition(next);
    setEnded(false);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (playerRef.current.requestFullscreen)
        await playerRef.current.requestFullscreen();
      else if (videoRef.current.webkitEnterFullscreen)
        videoRef.current.webkitEnterFullscreen();
      else setNotice("Этот браузер не поддерживает полноэкранное видео.");
    } catch {
      setNotice("Не удалось открыть полный экран. Попробуйте еще раз.");
    }
  };
  const transportLabel = playing
    ? "Приостановить видео"
    : ended
      ? "Повторить видео"
      : "Воспроизвести видео";

  return (
    <div
      ref={playerRef}
      className="video-player"
      tabIndex={0}
      role="group"
      aria-label={`Проигрыватель: ${title}`}
      style={{ aspectRatio: aspect, "--video-aspect": aspect }}
      data-playing={playing || undefined}
      onKeyDown={(event) => {
        if (event.target.closest("button, input, a")) return;
        if (event.code === "Space") {
          event.preventDefault();
          toggle();
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          seek(position - 5);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          seek(position + 5);
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={muted}
        style={{ objectFit: ratio ? "cover" : "contain" }}
        preload="metadata"
        onClick={toggle}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(requestedDuration || (Number.isFinite(video.duration) ? video.duration : 0));
          if (!ratio && video.videoWidth && video.videoHeight)
            setAspect(video.videoWidth / video.videoHeight);
        }}
        onDurationChange={(event) =>
          setDuration(
            requestedDuration || (Number.isFinite(event.currentTarget.duration)
              ? event.currentTarget.duration
              : 0),
          )
        }
        onTimeUpdate={(event) => {
          const next = loopOffset.current + event.currentTarget.currentTime;
          if (requestedDuration && next >= requestedDuration) {
            event.currentTarget.pause(); setEnded(true); setPosition(requestedDuration);
          } else setPosition(next);
        }}
        onPlay={(event) => {
          setPlaying(true);
          setEnded(false);
          document.dispatchEvent(
            new CustomEvent("molecula-media-play", {
              detail: { element: event.currentTarget },
            }),
          );
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          const video = videoRef.current;
          const next = loopOffset.current + video.duration;
          if (requestedDuration && next < requestedDuration - .05) {
            loopOffset.current = next;
            video.currentTime = 0;
            video.play().catch(() => setError("Не удалось продолжить видео."));
          } else { setPlaying(false); setEnded(true); }
        }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume);
          setMuted(event.currentTarget.muted);
        }}
        onError={() =>
          setError(
            "Видео не загрузилось. Проверьте соединение и повторите попытку.",
          )
        }
      />
      {error ? (
        <div className="video-player-error" role="status">
          <Icon name="info" size={24} />
          <p>{error}</p>
          <button
            type="button"
            className="pill"
            onClick={() => {
              setError("");
              videoRef.current.load();
              videoRef.current
                .play()
                .catch(() =>
                  setError("Видео пока недоступно. Попробуйте позже."),
                );
            }}
          >
            <Icon name="retry" size={16} />
            Попробовать снова
          </button>
        </div>
      ) : (
        !playing && (
          <button
            type="button"
            className="video-player-center"
            aria-label={transportLabel}
            onClick={toggle}
          >
            <PlayerIcon name={ended ? "retry" : "play"} size={24} />
          </button>
        )
      )}
      <div className="video-player-controls">
        {notice && (
          <p className="video-player-notice" role="status">
            {notice}
          </p>
        )}
        <input
          type="range"
          className="video-player-range video-player-seek"
          aria-label="Позиция видео"
          aria-valuetext={`${formatMediaTime(position)} из ${formatMediaTime(duration)}`}
          min="0"
          max={duration || 1}
          step="0.01"
          value={Math.min(position, duration || 1)}
          disabled={!duration || Boolean(error)}
          style={{
            "--range-progress": `${duration ? (position / duration) * 100 : 0}%`,
          }}
          onChange={(event) => seek(Number(event.target.value))}
        />
        <div className="video-player-transport">
          <button
            type="button"
            className="video-player-control"
            aria-label={transportLabel}
            onClick={toggle}
            disabled={Boolean(error)}
          >
            <PlayerIcon name={playing ? "pause" : ended ? "retry" : "play"} />
          </button>
          <span className="video-player-time">
            {formatMediaTime(position)}
            <span> / {formatMediaTime(duration)}</span>
          </span>
          <div className="video-player-volume">
            <button
              type="button"
              className="video-player-control"
              aria-label={
                muted || volume === 0
                  ? "Включить звук видео"
                  : "Выключить звук видео"
              }
              onClick={() => {
                const video = videoRef.current;
                const silent = video.muted || video.volume === 0;
                if (silent && video.volume === 0) video.volume = 0.7;
                video.muted = !silent;
              }}
            >
              <PlayerIcon name={muted || volume === 0 ? "muted" : "volume"} />
            </button>
            <input
              type="range"
              className="video-player-range"
              aria-label="Громкость видео"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              style={{ "--range-progress": `${muted ? 0 : volume * 100}%` }}
              onChange={(event) => {
                const video = videoRef.current;
                video.volume = Number(event.target.value);
                video.muted = video.volume === 0;
              }}
            />
          </div>
          <button
            type="button"
            className="video-player-control"
            aria-label={
              fullscreen ? "Выйти из полного экрана" : "Видео на весь экран"
            }
            onClick={toggleFullscreen}
          >
            <PlayerIcon name={fullscreen ? "collapse" : "expand"} />
          </button>
        </div>
      </div>
    </div>
  );
}
