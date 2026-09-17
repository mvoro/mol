import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Icon,
  ModeIcon,
  ModelIcon,
  MODE_NAMES,
  DEFAULT_MODELS,
  MODE_COLORS,
  sourceAsset,
} from "../ui.jsx";
import { SettingsMenu } from "./SettingsMenu.jsx";
import { PromptInput } from "./PromptInput.jsx";
import { normalizeParts, partsText, trimParts } from "../prompt-mentions.js";
import { ComposerBeam } from "./ComposerBeam.jsx";
import { useModalBehavior } from "./modal-behavior.js";
import { Tabs } from "./Tabs.jsx";
import { estimateGenerationCost } from "../generation-cost.js";
import "./composer.css";
export const defaultValues = (mode) => ({
  speed: "Быстро",
  role: "",
  web: false,
  reasoning: false,
  ratio: mode === "video" ? "16:9" : "Авто",
  quality: mode === "video" ? "720p" : "1K",
  count: "1 шт",
  duration: mode === "video" ? "5 с" : "Авто",
  voice: "Аля",
  language: "Русский",
  sound: false,
  backgroundMusic: false,
});
export function FileChip({ file, onRemove }) {
  const name = file?.name || "Документ.pdf";
  const extension = (
    file?.typeLabel ||
    name.split(".").pop() ||
    "FILE"
  ).toUpperCase();
  const mime = file?.mime || file?.type || "";
  const imageType = /^(IMAGE|PNG|JPE?G|WEBP|GIF|AVIF|HEIC|SVG)$/.test(extension) || mime.startsWith("image/");
  const image = imageType && Boolean(file.url || file.preview);
  const video =
    /^(MP4|MOV|WEBM|AVI)$/.test(extension) || mime.startsWith("video/");
  const audio =
    /^(MP3|WAV|M4A|OGG|FLAC)$/.test(extension) || mime.startsWith("audio/");
  const type = imageType
    ? "image"
    : video
      ? "video"
      : audio
        ? "audio"
        : extension === "PDF"
          ? "pdf"
          : "document";
  const subtitle =
    type === "image" ? "Изображение" : type === "document"
      ? "Документ"
      : type === "video"
        ? "Видео"
        : type === "audio"
          ? "Аудио"
          : "PDF";
  return (
    <div className={"file-chip file-chip--" + type} title={name}>
      {image ? (
        <img
          className="file-image-preview"
          src={file.url || file.preview}
          alt={name}
        />
      ) : (
        <>
          <span className={"file-format format-" + type}>
            {type === 'image' ? <ModeIcon mode="image" size={18}/> : <img
              src={
                "/assets/composer/file-" +
                (type === "pdf" ? "document" : type) +
                ".svg"
              }
              alt=""
              width={18}
              height={18}
            />}
          </span>
          <span className="file-chip-text">
            <span className="file-chip-name">{name}</span>
            <span className="file-chip-kind">{subtitle}</span>
          </span>
        </>
      )}
      {onRemove && (
        <button
          className="file-remove"
          type="button"
          aria-label={"Удалить " + name}
          onClick={onRemove}
        >
          <img
            src="/assets/composer/file-remove.svg"
            alt=""
            width={12}
            height={12}
          />
        </button>
      )}
    </div>
  );
}
export function UploadRefCard({
  ratio = "16:9",
  state = "default",
  file,
  onChange,
  onRemove,
  label = "Начальный кадр",
}) {
  const input = useRef(null);
  const [inputError, setInputError] = useState(false);
  const visualState = String(state).toLowerCase();
  const error = !file && (inputError || visualState === "error");
  const select = () => input.current?.click();
  const receive = (event) => {
    const next = event.target.files[0];
    event.target.value = "";
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setInputError(true);
      return;
    }
    setInputError(false);
    onChange?.(next);
  };
  return (
    <div
      className={
        "upload-ref" +
        (file ? " is-uploaded" : "") +
        (error ? " error" : "") +
        (visualState === "hover" && !file && !error ? " is-hover" : "")
      }
      data-ratio={ratio}
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={receive}
      />
      {file ? (
        <>
          <button
            type="button"
            className="ref-preview-button"
            onClick={select}
            aria-label={"Заменить " + label}
          >
            <img
              className="ref-preview"
              src={file.url || file.preview}
              alt={label}
            />
          </button>
          {onRemove && (
            <button
              type="button"
              aria-label={"Удалить " + label}
              className="ref-remove"
              onClick={onRemove}
            >
              <img
                src="/assets/composer/file-remove.svg"
                alt=""
                width={12}
                height={12}
              />
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          className="ref-select"
          onClick={select}
          aria-label={
            error
              ? "Добавить обязательный " + label.toLowerCase()
              : "Добавить " + label.toLowerCase()
          }
          aria-invalid={error || undefined}
        >
          <span className="ref-glyph" aria-hidden="true">
            <img
              className="ref-glyph-default"
              src="/assets/composer/ref-add.svg"
              alt=""
              width={20}
              height={20}
            />
            <img
              className="ref-glyph-hover"
              src="/assets/composer/ref-add-hover.svg"
              alt=""
              width={20}
              height={20}
            />
            <img
              className="ref-glyph-error"
              src="/assets/composer/ref-add-error.svg"
              alt=""
              width={20}
              height={20}
            />
          </span>
          <span>{label}</span>
        </button>
      )}
    </div>
  );
}
function TypeSheet({ mode, onChange, onClose }) {
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  return createPortal(
    <div
      className={"type-overlay" + (closing ? " is-closing" : "")}
      onClick={requestClose}
    >
      <div
        className="type-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Тип генерации"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <header>
          <b>Тип генерации</b>
          <button onClick={requestClose} aria-label="Закрыть выбор типа">
            <Icon name="close" />
          </button>
        </header>
        {Object.entries(MODE_NAMES).map(([m, label]) => (
          <button
            className={"type-option " + (mode === m ? "selected" : "")}
            key={m}
            onClick={() => {
              onChange(m);
              requestClose();
            }}
          >
            <span className="type-option-mode"><ModeIcon mode={m} /></span>
            <span>{label}</span>
            {mode === m && <Icon name="check" className="type-option-check" />}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
export function ChatComposer({
  mode = "auto",
  onModeChange = () => {},
  model,
  onModelOpen = () => {},
  values = {},
  onChange = () => {},
  generating = false,
  sendOnEnter = true,
  disabled = false,
  initialText = "",
  placeholder = "Спросите что-нибудь…",
  showFooter = true,
  showPromo = true,
  showTopPanel = true,
  hasConversation = false,
  offer,
  onDismissOffer = () => {},
  files = [],
  chatImages = [],
  onFilesChange = () => {},
  onSend = () => {},
  onAuth,
  onStop = () => {},
  onRoleInfo = () => {},
  cost,
  requiredRefs = false,
  forceState,
  state,
  device,
}) {
  const [text, setText] = useState(initialText),
    [menu, setMenu] = useState(null),
    [typeOpen, setTypeOpen] = useState(false),
    [listening, setListening] = useState(false),
    [submitted, setSubmitted] = useState(false),
    [notice, setNotice] = useState(""),
    [refs, setRefs] = useState([null, null]),
    [refError, setRefError] = useState(false),
    [drag, setDrag] = useState(false);
  const field = useRef(null),
    fileInput = useRef(null),
    recognition = useRef(null),
    refsUrls = useRef([]),
    lastMode = useRef(mode),
    menuX = useRef(20);
  const settings = { ...defaultValues(mode), ...values };
  const sendCost = cost ?? estimateGenerationCost(mode, settings);
  const costLabel = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(sendCost);
  const actualModel = model || DEFAULT_MODELS[mode];
  const mentionsEnabled = mode === "image" || mode === "video";
  const historyRefs = mode === 'video' ? settings.chatImages ? chatImages : settings.lastImage ? chatImages.slice(-1) : [] : [];
  const effectiveRefs = [refs[0] || historyRefs.at(-1) || null, refs[1]];
  const filled = Boolean(text.trim() || files.length || effectiveRefs.some(Boolean));
  const needRefs =
    requiredRefs || (mode === "video" && /Kling|Frames/i.test(actualModel));
  useEffect(() => {
    setText(initialText);
  }, [initialText]);
  useEffect(() => {
    if (lastMode.current !== mode) {
      setMenu(null);
      setNotice("");
      lastMode.current = mode;
    }
  }, [mode]);
  useLayoutEffect(() => {
    const resize = () => {
      const input = field.current?.element || field.current;
      if (!input) return;
      const min =
        window.matchMedia("(max-width:700px)").matches || device === "mobile"
          ? 24
          : 40;
      input.style.height = min + "px";
      input.style.height =
        Math.min(Math.max(input.scrollHeight, min), 200) + "px";
    };
    resize();
    const input = field.current?.element || field.current;
    let width = input?.clientWidth;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next !== width) {
        width = next;
        resize();
      }
    });
    if (input) observer.observe(input);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [text, device, mentionsEnabled]);
  useEffect(
    () => () => {
      recognition.current?.stop();
      refsUrls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!generating) return;
    setMenu(null);
    setTypeOpen(false);
  }, [generating]);
  const addFiles = (incoming) => {
    const next = [];
    for (const file of Array.from(incoming).slice(
      0,
      Math.max(0, 10 - files.length),
    )) {
      if (file.size > 25 * 1024 * 1024) {
        setNotice("Файл «" + file.name + "» больше 25 МБ");
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        mime: file.type,
        url: URL.createObjectURL(file),
        raw: file,
      });
    }
    onFilesChange([...files, ...next].slice(0, 10));
  };
  const submit = () => {
    if (disabled || generating || !filled) return;
    if (needRefs && !effectiveRefs[0]) {
      setRefError(true);
      setNotice("Добавьте начальный кадр для этой модели");
      return;
    }
    const photoFiles = [...files, ...(needRefs ? effectiveRefs.filter(Boolean) : [])];
    const parts = trimParts(normalizeParts(field.current?.getParts?.() || [{ type: 'text', text }], photoFiles));
    onSend(mentionsEnabled ? partsText(parts) : text.trim(), files, needRefs ? effectiveRefs : [], mentionsEnabled ? { version: 1, parts } : undefined);
    refsUrls.current = [];
    setRefs([null, null]);
    setText("");
    setSubmitted(true);
    setMenu(null);
    recognition.current?.stop();
  };
  const voice = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice(
        "Голосовой ввод недоступен в этом браузере. Откройте приложение в Chrome.",
      );
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "ru-RU";
    r.interimResults = true;
    r.continuous = true;
    const base = text;
    const baseParts = field.current?.getParts?.();
    r.onresult = (e) => {
      let spoken = "";
      for (const result of e.results) spoken += result[0].transcript + " ";
      if (baseParts && field.current?.setParts) field.current.setParts([...baseParts, { type: 'text', text: ' ' + spoken.trim() }]);
      else setText((base + " " + spoken).trim());
    };
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setListening(false);
      setNotice(
        e.error === "not-allowed"
          ? "Разрешите доступ к микрофону в настройках браузера"
          : "Не удалось распознать речь. Попробуйте ещё раз.",
      );
    };
    recognition.current = r;
    try { r.start(); setListening(true); }
    catch { setListening(false); setNotice('Не удалось включить микрофон. Попробуйте ещё раз.'); }
  };
  const openMenu = (key, event) => {
    if (generating || disabled) return;
    menuX.current = event.currentTarget.offsetLeft;
    setMenu(menu === key ? null : key);
  };
  const update = (key, value) => {
    if (['lastImage', 'chatImages'].includes(key) && value && !chatImages.length) {
      setNotice('В этом чате пока нет изображений. Создайте или прикрепите изображение.');
      return;
    }
    onChange(key, key === "role" && value === "Без роли" ? "" : value);
  };
  const chips =
    mode === "auto"
      ? [
          ["speed", "flash", settings.speed],
          ["role", "role", "Роль"],
        ]
      : mode === "text"
        ? [
            ["role", "role", "Роль"],
            ["web", "globe", "Поиск в сети"],
            ["reasoning", "brain", "Исследование"],
          ]
        : mode === "image"
          ? [
              ["ratio", "crop", settings.ratio],
              ["quality", "diamond", settings.quality],
              ["count", "copy", settings.count],
            ]
          : mode === "video"
            ? [
                ["ratio", "crop", settings.ratio],
                ["duration", "timer", settings.duration],
                ["quality", "diamond", settings.quality],
              ]
            : [
                ["voice", "voice", settings.voice],
                ["language", "globe", settings.language],
                ["duration", "timer", settings.duration],
              ];
  const handleInputKey = event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229 && (sendOnEnter || event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); }
    if (event.key === 'Escape') { setMenu(null); recognition.current?.stop(); }
  };
  const panel = showTopPanel
    ? offer
      ? "offer"
      : settings.role
        ? "role"
        : mode === "auto" && !hasConversation && !submitted
          ? "assistant"
          : null
    : null;
  return (
    <div
      className={
        "chat-composer mode-" +
        mode +
        (disabled ? " is-disabled" : "") +
        (generating ? " is-generating" : "") +
        (forceState === "Focus" || state === "focus" ? " force-focus" : "")
      }
      style={{
        "--accent": MODE_COLORS[mode],
        "--menu-x": menuX.current + "px",
      }}
      data-device={device}
      data-state={
        disabled
          ? "Disabled"
          : generating
            ? "Generating"
            : filled
              ? "Filled"
              : "Default"
      }
    >
      {panel && (
        <div className="top-panel-slot">
          <div className={"composer-top-panel panel-" + panel}>
            {panel === "assistant" ? (
              <>
                <ModelIcon model="Молли 1.0" size={14} />
                <span>
                  <span
                    className="t-think"
                    role="status"
                    aria-label="Молли ждёт ваш запрос…"
                  >
                    <span className="t-think-sizer" aria-hidden="true">
                      Молли ждёт ваш запрос…
                    </span>
                    <span
                      className="t-think-text"
                      data-text="Молли ждёт ваш запрос…"
                      aria-hidden="true"
                    >
                      Молли ждёт ваш запрос…
                    </span>
                  </span>
                </span>
                <button
                  title="Молли сама подберёт подходящую модель под ваш запрос"
                  aria-label="Что умеет Молли"
                  onClick={() =>
                    setNotice(
                      "Молли подбирает модель под задачу: отвечает на вопросы, создаёт тексты, картинки, видео и аудио.",
                    )
                  }
                >
                  <Icon name="info" />
                </button>
              </>
            ) : panel === "role" ? (
              <>
                <Icon name="role" size={14} />
                <button className="panel-role-name" onClick={() => onRoleInfo(settings.role)}>
                  {settings.role}
                </button>
                <button aria-label="О роли" onClick={() => onRoleInfo(settings.role)}>
                  <Icon name="info" />
                </button>
                <button
                  aria-label="Сбросить роль"
                  onClick={() => update("role", "")}
                >
                  <Icon name="close" size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="offer-text">
                  <b>
                    {typeof offer === "object"
                      ? offer.title
                      : "Больше возможностей с Молекулой"}
                  </b>
                  <small>
                    {typeof offer === "object"
                      ? offer.subtitle
                      : "Специальное предложение · ещё 23:59:59"}
                  </small>
                </div>
                <button
                  className="pill"
                  onClick={() =>
                    setNotice(
                      "Все нейросети в одном пространстве. Предложение представлено для демонстрации.",
                    )
                  }
                >
                  Подробнее
                </button>
                <button
                  aria-label="Закрыть предложение"
                  onClick={onDismissOffer}
                >
                  <Icon name="close" size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="composer-surface">
        <ComposerBeam active={generating} mode={mode} />
        <div
          className={"composer-wrapper " + (drag ? "drag-active" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !generating) setDrag(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!disabled && !generating) addFiles(e.dataTransfer.files);
          }}
        >
          <div className={"composer-field " + (!text ? "empty" : "")}>
            {needRefs && (
              <div className="ref-row">
                {effectiveRefs.map((f, i) => (
                  <UploadRefCard
                    key={i}
                    file={f}
                    label={i ? "Конечный кадр" : "Начальный кадр"}
                    ratio={settings.ratio === "Авто" ? "16:9" : settings.ratio}
                    state={!i && refError && !f ? "error" : "default"}
                    onChange={(file) => {
                      if (!file.type.startsWith("image/")) return;
                      if (file.size > 25 * 1024 * 1024) {
                        setNotice("Размер кадра не должен превышать 25 МБ");
                        return;
                      }
                      const url = URL.createObjectURL(file);
                      refsUrls.current.push(url);
                      setRefs((r) =>
                        r.map((v, j) =>
                          j === i ? { id: crypto.randomUUID(), url, name: file.name, mime: file.type, size: file.size, raw: file, refLabel: i ? "Конечный кадр" : "Начальный кадр" } : v,
                        ),
                      );
                      setRefError(false);
                    }}
                    onRemove={() => {
                      if (i === 0 && historyRefs.length) { onChange('lastImage', false); onChange('chatImages', false); }
                      setRefs((r) => r.map((v, j) => (j === i ? null : v)));
                    }}
                  />
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div className="file-row">
                {files.map((f, i) => (
                  <FileChip
                    key={f.id || i}
                    file={f}
                    onRemove={
                      disabled
                        ? null
                        : () => {
                            if (f.url?.startsWith("blob:"))
                              URL.revokeObjectURL(f.url);
                            onFilesChange(files.filter((_, j) => j !== i));
                          }
                    }
                  />
                ))}
              </div>
            )}
            {mentionsEnabled ? <PromptInput ref={field} value={text} placeholder={placeholder} files={[...files, ...(needRefs ? effectiveRefs.filter(Boolean) : [])]} disabled={disabled || generating || listening} onChange={next => setText(next)} onKeyDown={handleInputKey} onMentionOpen={() => setMenu(null)} onUpload={() => fileInput.current?.click()} /> : <textarea
              ref={field}
              data-composer-input
              value={text}
              aria-label="Сообщение"
              placeholder={placeholder}
              disabled={disabled}
              spellCheck={false}
              onChange={event => setText(event.target.value)}
              onKeyDown={handleInputKey}
            />}
            <div className="composer-bar">
              <div className="bar-scroll">
                <button
                  className={"pill round " + (menu === "main" ? "is-open" : "")}
                  data-settings-trigger
                  aria-label="Настройки генерации"
                  aria-expanded={menu === "main"}
                  disabled={disabled || generating}
                  onClick={(e) => openMenu("main", e)}
                >
                  <Icon name="add" size={14} />
                </button>
                {chips.map(([key, icon, label]) => {
                  const active =
                    ["role", "web", "reasoning"].includes(key) &&
                    Boolean(settings[key]);
                  return (
                    <div
                      className={"chip-group " + (active ? "active" : "")}
                      key={key}
                    >
                      <button
                        className={"pill " + (menu === key ? "is-open" : "")}
                        data-settings-trigger
                        disabled={disabled || generating}
                        aria-label={
                          key === "speed"
                            ? "Скорость ответа: " + label
                            : key === "role"
                              ? "Выбрать роль"
                              : key === "ratio"
                                ? "Соотношение сторон: " + label
                                : key === "quality"
                                  ? "Качество: " + label
                                  : key === "count"
                                    ? "Количество: " + label
                                    : label
                        }
                        aria-expanded={
                          !["web", "reasoning"].includes(key)
                            ? menu === key
                            : undefined
                        }
                        aria-pressed={
                          ["web", "reasoning"].includes(key)
                            ? Boolean(settings[key])
                            : undefined
                        }
                        onClick={(e) =>
                          ["web", "reasoning"].includes(key)
                            ? update(key, !settings[key])
                            : openMenu(key, e)
                        }
                      >
                        <Icon name={icon} size={14} />
                        <span>{label}</span>
                      </button>
                      {active && (
                        <button
                          className="chip-clear"
                          disabled={disabled || generating}
                          aria-label={"Сбросить " + label}
                          onClick={() =>
                            update(key, key === "role" ? "" : false)
                          }
                        >
                          <Icon name="close" size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                className={
                  "composer-submit " +
                  (filled || generating ? "colored" : "") +
                  (filled && !generating ? " has-cost" : "") +
                  (listening ? " listening" : "")
                }
                disabled={disabled}
                style={{ '--send-width': `${76 + costLabel.length * 7}px` }}
                aria-label={
                  generating
                    ? "Остановить генерацию"
                    : filled
                      ? `Отправить сообщение — ${cost == null ? 'примерно ' : ''}${costLabel} MC`
                      : listening
                        ? "Остановить запись"
                        : "Голосовой ввод"
                }
                title={filled && !generating ? `${cost == null ? 'Примерная стоимость' : 'Стоимость'}: ${costLabel} MC` : undefined}
                onClick={generating ? onStop : filled ? submit : voice}
              >
                <span className="submit-glyph">{["mic", "send", "stop"].map((icon) => (
                  <span
                    className={
                      "icon-swap" +
                      (icon === (generating ? "stop" : filled ? "send" : "mic")
                        ? " is-visible"
                        : "")
                    }
                    key={icon}
                    aria-hidden="true"
                  >
                    <Icon name={icon} size={14} />
                  </span>
                ))}</span>
                <span className="submit-cost" aria-hidden="true"><span>{costLabel}</span><Icon name="molecule" size={12}/></span>
              </button>
            </div>
          </div>
          {showFooter && (
            <div className="composer-footer">
              <Tabs
                className="desktop-type-tabs"
                label="Тип генерации"
                value={mode}
                onChange={onModeChange}
                disabled={generating || disabled}
                items={Object.entries(MODE_NAMES).map(([id, label]) => ({ id, label, icon: <ModeIcon mode={id} mono={mode !== id}/> }))}
              />
              <button
                className="pill mobile-type-select"
                disabled={generating || disabled}
                onClick={() => setTypeOpen(true)}
                aria-label="Выбрать тип генерации"
              >
                <ModeIcon mode={mode} />
                {MODE_NAMES[mode]}
                <Icon name="chevron" size={12} />
              </button>
              <button
                className="pill composer-model"
                disabled={generating || disabled}
                onClick={onModelOpen}
                aria-label="Выбрать модель"
              >
                <ModelIcon model={actualModel} size={14} />
                <span>{actualModel}</span>
                <Icon name="chevron" size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
      {showPromo && (
        <button
          disabled={disabled}
          className="composer-promo"
          onClick={() => onAuth ? onAuth() :
            setNotice(
              "Первая генерация доступна бесплатно. Опишите, что хотите создать.",
            )
          }
        >
          <Icon name="gift" size={12} />
          <span>1 бесплатная генерация</span>
        </button>
      )}
      {notice && (
        <div className="composer-notice" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Закрыть уведомление"
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      )}
      <input
        ref={fileInput}
        hidden
        type="file"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {
        <SettingsMenu
          mode={mode}
          values={settings}
          onChange={update}
          menu={menu}
          onClose={() => setMenu(null)}
          onUpload={() => {
            setMenu(null);
            fileInput.current?.click();
          }}
          onRoleInfo={(role) => {
            setMenu(null);
            setTimeout(() => onRoleInfo(role), 260);
          }}
        />
      }
      {typeOpen && (
        <TypeSheet
          mode={mode}
          onChange={onModeChange}
          onClose={() => setTypeOpen(false)}
        />
      )}
    </div>
  );
}
