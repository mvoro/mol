import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, ModeIcon, ModelIcon } from "../ui";
import { useModalBehavior } from "./modal-behavior";
import { InputShell, TextInput } from "./TextInput.jsx";
import { Tabs } from "./Tabs.jsx";
import "./model-picker.css";

const ASSETS = "/assets/models/";
const modes = [
  { id: "text", label: "Текст" },
  { id: "image", label: "Картинка" },
  { id: "video", label: "Видео" },
  { id: "audio", label: "Аудио" },
];

export const textModels = [
  ["Молли 1.0", "Молекула", "molly", "Новое", "×3", true],
  ["ChatGPT 5.5", "OpenAI", "openai", "-50%", "", true],
  ["Claude Opus 4.8", "Antropic", "claude", "", "×3", true],
  ["DeepSeek V4 Pro", "Open Source China", "deepseek", "", "Бесплатно", true],
  ["Claude Fable 5", "Antropic", "claude", "Новое", "×3.5"],
  ["Claude Sonnet 5", "Anthropic", "claude", "", "×1.5"],
  ["Claude Haiku 4.5", "Anthropic", "claude", "", "×1"],
  ["Gemini 3.1 Flash", "Google", "gemini", "", "Бесплатно"],
  ["Gemini 3.1 Pro", "Google Gemma", "gemini", "Новое", "×1.5"],
  ["Grok 4.3", "xAI", "grok", "", "×1.5"],
  ["Grok 4.2", "xAI", "grok", "", "×1"],
  ["Perplexity Sonar", "Sonar & Sonar Pro", "perplexity", "", "×1"],
  ["Perplexity Sonar Pro", "Sonar & Sonar Pro", "perplexity", "", "×1"],
  [
    "Perplexity Sonar Deep Research",
    "Sonar & Sonar Pro",
    "perplexity",
    "",
    "×1",
  ],
  ["DeepSeek V4 Flash", "Open Source China", "deepseek", "", "Бесплатно"],
  ["DeepSeek V4 Pro", "Open Source China", "deepseek", "", "×2"],
  ["Kimi K2.6", "Moonshoot", "kimi", "", "×2"],
  ["Kimi K2 Thinking", "Moonshoot", "kimi", "Новое", "×2"],
  ["Qwen 3.6 Plus", "Универсальная модель Alibaba", "qwen", "", "×2"],
  ["GLM 5.2", "Флагман Z.ai", "glm", "Новое", "×2"],
  ["GLM 4.7", "Стабильная рабочая лошадка", "glm", "", "×2"],
  ["GLM 4.7 Flash", "Мгновенные ответы GLM", "glm", "Бесплатный", "×2"],
];

// Model labels mirror the composer defaults and model assets in the supplied flow.
const modelCatalog = {
  text: textModels,
  image: [
    ["Молли 1.0", "Молекула", "molly", "Новое", "×3", true],
    ["Nano Banana", "Google", "gemini", "", "×1", true],
    ["GPT Image", "OpenAI", "openai", "", "×2", true],
    ["Nano Banana Pro", "Google", "gemini", "Новое", "×3"],
    ["FLUX.1", "Black Forest Labs", null, "", "×2"],
    ["Recraft", "Recraft", null, "", "×2"],
  ],
  video: [
    ["Sora 2", "OpenAI", "openai", "", "×3", true],
    ["Veo 3", "Google", "gemini", "Новое", "×3", true],
    ["Kling", "Kuaishou", null, "", "×2", true],
    ["Runway", "Runway", null, "", "×3"],
  ],
  audio: [
    ["Suno v5", "Suno", null, "Новое", "×2", true],
    ["ElevenLabs", "ElevenLabs", null, "", "×1", true],
    ["OpenAI TTS", "OpenAI", "openai", "", "×1", true],
  ],
};

const brandAssets = {
  molly: "imgIcon.svg",
  openai: "imgGpt5.svg",
  claude: "imgIcon1.svg",
  deepseek: "imgIcon2.svg",
  gemini: "imgIcon3.svg",
  grok: "imgIcon4.svg",
  perplexity: "imgIcon5.svg",
  kimi: "imgIcon6.svg",
  qwen: "imgIcon7.svg",
  glm: "imgIcon8.svg",
};

function ModelRow({ item, active, onSelect }) {
  const [name, description, brand, badge, multiplier] = item;
  return (
    <button
      type="button"
      className={`mp-model-row${active ? " is-selected" : ""}`}
      role="option"
      aria-selected={active}
      onClick={onSelect}
    >
      <span className="mp-model-avatar">
        {brandAssets[brand] ? (
          <img
            src={`${ASSETS}${brandAssets[brand]}`}
            alt=""
            width="20"
            height="20"
          />
        ) : (
          <ModelIcon model={name} size={20} />
        )}
      </span>
      <span className="mp-model-text">
        <span className="mp-model-name-row">
          <span className="mp-model-name">{name}</span>
          {badge && (
            <span
              className={`mp-model-badge${badge === "Бесплатный" || badge.startsWith("-") ? " is-mint" : ""}`}
            >
              {badge}
            </span>
          )}
        </span>
        <span className="mp-model-description">{description}</span>
      </span>
      {active ? (
        <Icon name="check" className="mp-check" size={14}/>
      ) : (
        multiplier && (
          <span className="mp-multiplier">
            {multiplier}
            {multiplier.startsWith("×") && (
              <img
                src={`${ASSETS}imgFrame16.svg`}
                alt=""
                width="8"
                height="8"
              />
            )}
          </span>
        )
      )}
    </button>
  );
}

export function ModelPicker({
  mode = "text",
  initialMode = mode,
  model = "ChatGPT 5.5",
  onSelect,
  onClose,
}) {
  const id = useId();
  const initialTab =
    initialMode === "auto" || !modes.some((item) => item.id === initialMode)
      ? "text"
      : initialMode;
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const selectionMade = useRef(false);
  const { dialogRef, closing, requestClose } = useModalBehavior(
    onClose,
    inputRef,
  );
  const search = query.trim().toLocaleLowerCase();
  const results = useMemo(
    () =>
      (modelCatalog[tab] || textModels).filter(([name, description]) =>
        `${name} ${description}`.toLocaleLowerCase().includes(search),
      ),
    [tab, search],
  );
  const popular = results.filter((item) => item[5]);
  const remaining = results.filter((item) => !item[5]);

  const changeTab = (next) => {
    setTab(next);
    if (listRef.current) listRef.current.scrollTop = 0;
  };
  const choose = (name) => {
    if (selectionMade.current || closing) return;
    selectionMade.current = true;
    onSelect?.(name === "Молли 1.0" ? "auto" : tab, name);
    requestClose();
  };
  const onListKeyDown = (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = [...listRef.current.querySelectorAll('[role="option"]')];
    if (!options.length) return;
    const current = options.indexOf(document.activeElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
            options.length;
    options[next].focus();
  };
  const renderRows = (items, label) =>
    items.length > 0 && (
      <div role="group" aria-label={label}>
        {!search && <div className="mp-list-label">{label}</div>}
        {items.map((item, index) => (
          <ModelRow
            key={`${item[0]}-${index}`}
            item={item}
            active={
              model === item[0] || (mode === "auto" && item[0] === "Молли 1.0")
            }
            onSelect={() => choose(item[0])}
          />
        ))}
      </div>
    );

  return createPortal(
    <div
      className="mp-overlay"
      data-closing={closing || undefined}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        className="mp-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Выберите модель"
        tabIndex={-1}
        data-closing={closing || undefined}
      >
        <div className="mp-mobile-grabber" aria-hidden="true">
          <span />
        </div>
        <div className="mp-mobile-header">
          <span>Выберите модель</span>
          <button
            className="mp-close"
            onClick={requestClose}
            aria-label="Закрыть выбор модели"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="mp-body">
          <InputShell className="mp-search">
            <TextInput
              variant="bare"
              ref={inputRef}
              aria-label="Быстрый поиск модели"
              placeholder="Быстрый поиск модели"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  listRef.current?.querySelector('[role="option"]')?.focus();
                }
                if (event.key === "Enter" && results.length === 1) {
                  event.preventDefault();
                  choose(results[0][0]);
                }
              }}
            />
            {query ? (
              <button
                aria-label="Очистить поиск модели"
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                <Icon name="close" size={18} />
              </button>
            ) : (
              <Icon name="search" size={18}/>
            )}
          </InputShell>
          <Tabs className="mp-tabs" label="Тип модели" id={id} value={tab} onChange={changeTab} items={modes.map(item => ({ ...item, controls: `${id}-models`, icon: <ModeIcon mode={item.id} mono={tab !== item.id} size={16}/> }))}/>
          <div className="mp-list-wrap">
            <div
              className="mp-list"
              ref={listRef}
              id={`${id}-models`}
              role="listbox"
              aria-label={`${modes.find((item) => item.id === tab)?.label}: модели`}
              onKeyDown={onListKeyDown}
            >
              {results.length ? (
                <>
                  {renderRows(popular, "Популярные модели")}
                  {renderRows(remaining, "Все модели")}
                </>
              ) : (
                <div className="mp-empty" role="status">
                  <Icon name="search" size={24}/>
                  <p>
                    Ничего не найдено,
                    <br />
                    попробуйте изменить запрос
                  </p>
                </div>
              )}
            </div>
            {!!results.length && (
              <div className="mp-list-fade" aria-hidden="true" />
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default ModelPicker;
