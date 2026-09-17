import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DownloadSimple, Copy, ArrowCounterClockwise, MagnifyingGlassPlus, MagnifyingGlassMinus } from "../outline-icons.jsx";
import { Icon, ModeIcon, ModelIcon } from "../ui.jsx";
import { useModalBehavior } from "./modal-behavior.js";
import { VideoPlayer } from "./VideoPlayer.jsx";
import "./media-viewer.css";
import { ratioValue, describeRequestOptions } from "../generation-request.js";
import { downloadImageResult } from "../media-download.js";

function ZoomIcon({ zoomed }) {
  const Glyph = zoomed ? MagnifyingGlassMinus : MagnifyingGlassPlus;
  return <Glyph size={18} weight="regular" aria-hidden="true" />;
}

export function MediaViewer({ items = [], initialId, onClose, onReuse }) {
  const id = useId();
  const [selectedId, setSelectedId] = useState(initialId);
  const [view, setView] = useState({ zoom: false, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [failedImage, setFailedImage] = useState(null);
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState("");
  const closeRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const pendingReuse = useRef(null);
  const noticeTimer = useRef(null);
  const { dialogRef, closing, requestClose } = useModalBehavior(() => {
    onClose?.();
    if (pendingReuse.current) onReuse?.(pendingReuse.current);
  }, closeRef);
  const shown = items.filter(
    (item) =>
      item?.src &&
      item.ready !== false &&
      ["image", "video"].includes(item.type),
  );
  const index = Math.max(
    0,
    shown.findIndex((item) => item.id === selectedId),
  );
  const active = shown[index];
  const isVideo = active?.type === "video";
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
  useEffect(() => {
    setSelectedId(initialId);
    setView({ zoom: false, x: 0, y: 0 });
  }, [initialId]);

  const go = (direction) => {
    if (shown.length < 2) return;
    setSelectedId(shown[(index + direction + shown.length) % shown.length].id);
    setView({ zoom: false, x: 0, y: 0 });
    setDragging(false);
    dragRef.current = null;
    suppressClick.current = false;
    setNotice("");
  };
  const zoom = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setView((current) => ({ zoom: !current.zoom, x: 0, y: 0 }));
  };
  const announce = (text) => {
    setNotice(text);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.title || "");
      announce("Запрос скопирован");
    } catch {
      announce("Не удалось скопировать. Можно выделить текст запроса ниже.");
    }
  };
  const filename = active
    ? `molecula-${active.id || "result"}.${active.src.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] || (isVideo ? "mp4" : "png")}`
    : "molecula";

  const viewer = (
    <div className="media-viewer-overlay" data-closing={closing || undefined}>
      <section
        ref={dialogRef}
        className="media-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        data-closing={closing || undefined}
        onKeyDown={(event) => {
          if (
            event.defaultPrevented ||
            event.target.closest(
              "input,textarea,select,[role=slider],.video-player",
            )
          )
            return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(-1);
          }
        }}
      >
        <header className="media-viewer-header">
          <button
            ref={closeRef}
            className="media-viewer-glass"
            type="button"
            aria-label="Закрыть просмотр"
            onClick={requestClose}
          >
            <Icon name="close" size={18} />
          </button>
          <span className="media-viewer-counter" aria-live="polite">
            {shown.length
              ? `${index + 1} / ${shown.length}`
              : "Нет доступных работ"}
          </span>
          {active && !isVideo ? (
            <button
              className="media-viewer-glass"
              type="button"
              aria-label={
                view.zoom ? "Уменьшить изображение" : "Увеличить изображение"
              }
              aria-pressed={view.zoom}
              disabled={failedImage === active.id}
              onClick={zoom}
            >
              <ZoomIcon zoomed={view.zoom} />
            </button>
          ) : (
            <span className="media-viewer-header-spacer" />
          )}
        </header>
        {active ? (
          <div className="media-viewer-body">
            <div
              className="media-viewer-stage"
              ref={stageRef}
              tabIndex={isVideo ? -1 : 0}
              aria-label={isVideo ? "Просмотр видео" : "Просмотр изображения"}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) requestClose();
              }}
            >
              {shown.length > 1 && (
                <button
                  className="media-viewer-glass media-viewer-nav media-viewer-prev"
                  type="button"
                  aria-label="Предыдущая работа"
                  onClick={() => go(-1)}
                >
                  <Icon name="chevron" size={18} />
                </button>
              )}
              <div key={active.id} className="media-viewer-media" style={{ "--result-aspect": ratioValue(active.ratio, 4 / 3) }}>
                {isVideo ? (
                  <div className="media-viewer-video">
                    <VideoPlayer
                      src={active.src}
                      ratio={active.ratio}
                      requestedDuration={active.duration}
                      sound={active.sound}
                      poster={active.poster}
                      title={active.title || "Видео"}
                    />
                  </div>
                ) : failedImage === active.id ? (
                  <div className="media-viewer-error">
                    <Icon name="info" size={28} />
                    <p>Изображение не загрузилось</p>
                    <button
                      className="pill"
                      type="button"
                      onClick={() => {
                        setFailedImage(null);
                        setRetry((value) => value + 1);
                      }}
                    >
                      Попробовать снова
                    </button>
                  </div>
                ) : (
                  <img
                    key={`${active.id}-${retry}`}
                    ref={imageRef}
                    src={active.src}
                    alt={active.title || "Созданное изображение"}
                    draggable={false}
                    className={`media-viewer-image${active.ratio ? " has-output-ratio" : ""}`}
                    style={{
                      transform: `translate(${view.x}px,${view.y}px) scale(${view.zoom ? 2 : 1})`,
                      cursor: view.zoom
                        ? dragging
                          ? "grabbing"
                          : "grab"
                        : "zoom-in",
                      touchAction: view.zoom ? "none" : "auto",
                      transition: dragging ? "none" : undefined,
                    }}
                    onError={() => setFailedImage(active.id)}
                    onClick={zoom}
                    onPointerDown={(event) => {
                      if (!view.zoom) return;
                      dragRef.current = {
                        x: event.clientX,
                        y: event.clientY,
                        px: view.x,
                        py: view.y,
                        moved: false,
                      };
                      suppressClick.current = false;
                      setDragging(true);
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                      const drag = dragRef.current;
                      if (!drag) return;
                      const dx = event.clientX - drag.x,
                        dy = event.clientY - drag.y;
                      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
                      const limitX = Math.max(
                        0,
                        (imageRef.current.clientWidth * 2 -
                          stageRef.current.clientWidth) /
                          2,
                      );
                      const limitY = Math.max(
                        0,
                        (imageRef.current.clientHeight * 2 -
                          stageRef.current.clientHeight) /
                          2,
                      );
                      setView({
                        zoom: true,
                        x: Math.max(-limitX, Math.min(limitX, drag.px + dx)),
                        y: Math.max(-limitY, Math.min(limitY, drag.py + dy)),
                      });
                    }}
                    onPointerUp={() => {
                      suppressClick.current = dragRef.current?.moved || false;
                      dragRef.current = null;
                      setDragging(false);
                    }}
                    onPointerCancel={() => {
                      dragRef.current = null;
                      setDragging(false);
                      suppressClick.current = false;
                    }}
                  />
                )}
              </div>
              {shown.length > 1 && (
                <button
                  className="media-viewer-glass media-viewer-nav media-viewer-next"
                  type="button"
                  aria-label="Следующая работа"
                  onClick={() => go(1)}
                >
                  <Icon name="chevron" size={18} />
                </button>
              )}
            </div>
            <aside className="media-viewer-details">
              <div className="media-viewer-kind">
                <ModeIcon mode={active.type} size={18} />
                <h2 id={`${id}-title`}>{isVideo ? "Видео" : "Изображение"}</h2>
              </div>
              <div className="media-viewer-prompt">
                <span>Запрос</span>
                <p>{active.title || "Без описания"}</p>
              </div>
              {active.model && (
                <span className="media-viewer-model">
                  <ModelIcon model={active.model} size={16} />
                  {active.model}
                </span>
              )}
              {active.settings && <div className="media-viewer-options"><span>Настройки</span><p>{describeRequestOptions({ mode: active.type, settings: active.settings, references: active.references || [] })}</p></div>}
              <div className="media-viewer-actions">
                <button type="button" className="pill round viewer-action" aria-label="Использовать запрос" title="Использовать запрос" onClick={() => { if (closing) return; pendingReuse.current = active; requestClose(); }}><ArrowCounterClockwise size={18} weight="regular" aria-hidden="true"/></button>
                <a className="pill round viewer-action" href={active.src} download={filename} aria-label={isVideo ? "Скачать исходное видео" : "Скачать результат"} title={isVideo ? "Скачать исходное видео" : "Скачать результат"} onClick={async event => {
                  if (isVideo || !active.width) return;
                  event.preventDefault();
                  try { await downloadImageResult(active); } catch { announce('Не удалось сохранить изображение. Попробуйте ещё раз.'); }
                }}><DownloadSimple size={18} weight="regular" aria-hidden="true"/></a>
                <button className="pill round viewer-action" type="button" onClick={copy} aria-label="Копировать запрос" title="Копировать запрос"><Copy size={18} weight="regular" aria-hidden="true"/></button>
              </div>
              {notice && (
                <p className="media-viewer-notice" role="status">
                  {notice}
                </p>
              )}
            </aside>
          </div>
        ) : (
          <div className="media-viewer-empty">
            <h2 id={`${id}-title`}>Работа пока недоступна</h2>
            <p>Закройте просмотр и попробуйте выбрать другой результат.</p>
          </div>
        )}
      </section>
    </div>
  );
  return typeof document === "undefined"
    ? viewer
    : createPortal(viewer, document.body);
}
