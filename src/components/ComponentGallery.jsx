import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRotateLeft,
  Check,
  ChevronRight,
  CircleInfo,
} from "@gravity-ui/icons";
import {
  ChatComposer,
  FileChip,
  UploadRefCard,
  defaultValues,
} from "./ChatComposer.jsx";
import { ModelPicker } from "./ModelPicker.jsx";
import { RolesShowcase } from "./RolesShowcase.jsx";
import { Tabs } from "./Tabs.jsx";
import { Select } from "./Select.jsx";
import { ModeIcon, ModelIcon, MODE_NAMES, DEFAULT_MODELS } from "../ui.jsx";
import "./component-gallery.css";

const MODES = ["auto", "text", "image", "video", "audio"];
const STATES = ["Default", "Focus", "Filled", "Generating", "Disabled"];
const STATE_COPY = {
  Default: "Плейсхолдер и микрофон. Тип и модель доступны.",
  Focus: "Нейтральная обводка 1,5 px. Цвет типа остаётся у каретки.",
  Filled: "Микрофон сменяется отправкой. Кнопка принимает цвет типа.",
  Generating: "Отправка сменяется стопом. Выбор типа и модели недоступен.",
  Disabled: "Карточка и промо-плашка приглушены до 40%.",
};
const SAMPLE_TEXT = "Сделай короткий ролик про запуск нового продукта";
const SAMPLE_FILES = [
  {
    id: "sample-docx",
    name: "Документ.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 125440,
  },
  {
    id: "sample-pdf",
    name: "Презентация.pdf",
    type: "application/pdf",
    size: 2457600,
  },
  { id: "sample-mp4", name: "Видео.mp4", type: "video/mp4", size: 18432000 },
  { id: "sample-mp3", name: "Аудио.mp3", type: "audio/mpeg", size: 4531200 },
];

function Section({ number, id, title, children, description }) {
  return (
    <section
      id={id}
      className="gallery-section"
      aria-labelledby={`${id}-title`}
    >
      <div className="gallery-section-heading">
        <span className="gallery-section-number">{number}</span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Example({ title, description, children, className = "" }) {
  return (
    <article className={`gallery-example ${className}`}>
      <div className="gallery-example-heading">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="gallery-example-content">{children}</div>
    </article>
  );
}

function ComposerExample({
  mode: initialMode = "auto",
  state = "Default",
  role = "",
  files: initialFiles = [],
  offer = false,
  showTopPanel = false,
  showFooter = true,
  showPromo = true,
  requiredRefs = false,
  device,
  imageUrl,
}) {
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState(() => ({
    ...defaultValues(initialMode),
    role,
  }));
  const [model, setModel] = useState(DEFAULT_MODELS[initialMode]);
  const initialFileList = () =>
    imageUrl && initialFiles.length > 0
      ? [
          ...initialFiles,
          {
            id: "sample-image",
            name: "Референс.png",
            type: "image/png",
            url: imageUrl,
            preview: imageUrl,
            size: 512000,
          },
        ]
      : initialFiles;
  const [files, setFiles] = useState(initialFileList);
  const [offerVisible, setOfferVisible] = useState(offer);
  const [picker, setPicker] = useState(false);
  const [roleInfo, setRoleInfo] = useState(null);
  const [generating, setGenerating] = useState(state === "Generating");
  const [feedback, setFeedback] = useState("");
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(
    state === "Filled" || state === "Generating" ? SAMPLE_TEXT : "",
  );
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function changeMode(next) {
    setMode(next);
    setModel(DEFAULT_MODELS[next]);
    setValues((previous) => ({ ...defaultValues(next), role: previous.role }));
  }

  function reset() {
    window.clearTimeout(timer.current);
    setMode(initialMode);
    setModel(DEFAULT_MODELS[initialMode]);
    setValues({ ...defaultValues(initialMode), role });
    setFiles(initialFileList());
    setOfferVisible(offer);
    setGenerating(state === "Generating");
    setFeedback("");
    setDraft(state === "Filled" || state === "Generating" ? SAMPLE_TEXT : "");
    setRevision((value) => value + 1);
  }

  function send() {
    setGenerating(true);
    setFeedback("");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setGenerating(false);
      setFeedback("Готово. Отправка и смена состояний работают.");
    }, 2200);
  }

  return (
    <div
      className={`gallery-composer-demo ${device === "mobile" ? "gallery-mobile-composer" : ""}`}
    >
      <ChatComposer
        key={revision}
        mode={mode}
        onModeChange={changeMode}
        model={model}
        onModelOpen={() => setPicker(true)}
        values={values}
        onChange={(key, value) =>
          setValues((previous) => ({ ...previous, [key]: value }))
        }
        generating={generating}
        disabled={state === "Disabled"}
        forceState={state}
        device={device}
        initialText={draft}
        showFooter={showFooter}
        showPromo={showPromo}
        showTopPanel={showTopPanel}
        offer={offerVisible}
        onDismissOffer={() => setOfferVisible(false)}
        files={files}
        onFilesChange={setFiles}
        onSend={send}
        onStop={() => {
          window.clearTimeout(timer.current);
          setGenerating(false);
          setFeedback("Генерация остановлена.");
        }}
        onRoleInfo={(selectedRole) =>
          setRoleInfo(
            typeof selectedRole === "string"
              ? selectedRole
              : values.role || "Сценарист Reels",
          )
        }
        requiredRefs={requiredRefs}
      />
      <div className="gallery-demo-meta">
        <span role="status">{feedback}</span>
        <button
          className="gallery-control gallery-reset"
          type="button"
          onClick={reset}
          aria-label="Сбросить пример"
        >
          <ArrowRotateLeft width={13} height={13} />
          Сбросить
        </button>
      </div>
      {picker && (
        <ModelPicker
          mode={mode}
          model={model}
          onClose={() => setPicker(false)}
          onSelect={(nextMode, name) => {
            if (nextMode !== mode) changeMode(nextMode);
            setModel(name);
          }}
        />
      )}
      {roleInfo && (
        <RolesShowcase
          initialRole={roleInfo}
          onClose={() => setRoleInfo(null)}
          onSelectRole={(selectedRole, prompt) => {
            setValues((previous) => ({ ...previous, role: selectedRole }));
            if (typeof prompt === "string") {
              setDraft(prompt);
              setRevision((value) => value + 1);
            }
            setRoleInfo(null);
          }}
        />
      )}
    </div>
  );
}

export function GalleryBadge({
  color = "primary",
  size = "sm",
  children = "Новое",
}) {
  return (
    <span
      className={`gallery-badge gallery-badge--${color} gallery-badge--${size}`}
    >
      {children}
    </span>
  );
}

function SelectExamples() {
  const id = useId();
  const [library, setLibrary] = useState("yes");
  const [memory, setMemory] = useState("default");
  const memoryOptions = [
    {
      value: "default",
      label: "Память по умолчанию",
      description: "Можно использовать контекст из других чатов.",
    },
    {
      value: "project",
      label: "Только этот проект",
      description: "Контекст ограничен чатами этого проекта.",
    },
  ];

  return (
    <div className="gallery-select-examples">
      <div className="gallery-select-example">
        <label htmlFor={`${id}-library`}>Доступ к библиотеке</label>
        <Select
          id={`${id}-library`}
          value={library}
          onChange={setLibrary}
          options={[
            { value: "yes", label: "Включено" },
            { value: "no", label: "Выключено" },
          ]}
        />
        <span>Обычный выбор</span>
      </div>
      <div className="gallery-select-example">
        <label htmlFor={`${id}-memory`}>Память</label>
        <Select
          id={`${id}-memory`}
          value={memory}
          onChange={setMemory}
          options={memoryOptions}
        />
        <span>Варианты с описаниями</span>
      </div>
      <div className="gallery-select-example">
        <label htmlFor={`${id}-disabled`}>Память · недоступно</label>
        <Select
          id={`${id}-disabled`}
          value="default"
          options={memoryOptions}
          disabled
        />
        <span>Disabled</span>
      </div>
    </div>
  );
}

function RowExample({ size = "md", variant = "default", control = "none" }) {
  const [checked, setChecked] = useState(variant === "selected");
  return (
    <button
      type="button"
      className={`gallery-control gallery-menu-row gallery-menu-row--${size} gallery-menu-row--${variant}`}
      aria-pressed={control === "none" ? undefined : checked}
      onClick={() => setChecked(!checked)}
    >
      <CircleInfo width={16} height={16} />
      <span>Кнопка</span>
      {control === "none" && (
        <ChevronRight className="gallery-row-end" width={14} height={14} />
      )}
      {control === "checkbox" && (
        <span
          className={`gallery-row-check gallery-row-end ${checked ? "is-checked" : ""}`}
        >
          {checked && <Check width={12} height={12} />}
        </span>
      )}
      {control === "radio" && (
        <span
          className={`gallery-row-radio gallery-row-end ${checked ? "is-checked" : ""}`}
        />
      )}
      {control === "switch" && (
        <span
          className={`gallery-row-switch gallery-row-end ${checked ? "is-checked" : ""}`}
        >
          <span />
        </span>
      )}
    </button>
  );
}

function FileExamples({ imageUrl }) {
  const [removed, setRemoved] = useState([]);
  const files = imageUrl
    ? [
        ...SAMPLE_FILES,
        {
          id: "sample-image",
          name: "Референс.png",
          type: "image/png",
          url: imageUrl,
          preview: imageUrl,
          size: 512000,
        },
      ]
    : SAMPLE_FILES;
  return (
    <div>
      <div className="gallery-file-examples">
        {files
          .filter((file) => !removed.includes(file.id))
          .map((file) => (
            <div className="gallery-labeled-primitive" key={file.id}>
              <FileChip
                file={file}
                onRemove={() =>
                  setRemoved((previous) => [...previous, file.id])
                }
              />
              <span>
                {file.type.startsWith("image")
                  ? "IMAGE"
                  : file.name.split(".").pop().toUpperCase()}
              </span>
            </div>
          ))}
      </div>
      {removed.length > 0 && (
        <button
          className="gallery-control gallery-text-button"
          type="button"
          onClick={() => setRemoved([])}
        >
          Восстановить вложения
        </button>
      )}
    </div>
  );
}

function RefExample({ state, ratio = "1:1", imageUrl }) {
  const [file, setFile] = useState(
    state === "uploaded" && imageUrl
      ? {
          name: "Референс.png",
          type: "image/png",
          url: imageUrl,
          preview: imageUrl,
        }
      : null,
  );
  const objectUrls = useRef([]);
  useEffect(
    () => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  function chooseFile(nextFile) {
    if (!nextFile?.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(nextFile);
    objectUrls.current.push(url);
    setFile({ name: nextFile.name, type: nextFile.type, url, preview: url });
  }
  return (
    <div className="gallery-labeled-primitive">
      <UploadRefCard
        label="Первый кадр"
        state={file ? "uploaded" : state}
        ratio={ratio}
        file={file}
        onChange={chooseFile}
        onRemove={() => setFile(null)}
      />
      <span>
        {state} · {ratio}
      </span>
    </div>
  );
}

function PrimitiveModels() {
  const [selected, setSelected] = useState("selected");
  return (
    <div className="gallery-model-states">
      {["loading", "default", "hover", "selected"].map((state) => (
        <div className="gallery-labeled-primitive" key={state}>
          <button
            className={`gallery-control gallery-model-row gallery-model-row--${state} ${selected === state ? "is-selected" : ""}`}
            disabled={state === "loading"}
            type="button"
            onClick={() => setSelected(state)}
          >
            <span className="gallery-model-icon">
              {state !== "loading" && <ModelIcon model="GPT-5" size={22} />}
            </span>
            {state === "loading" ? (
              <span className="gallery-model-skeleton">
                <i />
                <i />
              </span>
            ) : (
              <span className="gallery-model-copy">
                <strong>ChatGPT</strong>
                <span>OpenAI</span>
              </span>
            )}
            {state !== "loading" &&
              (selected === state ? (
                <Check width={14} height={14} />
              ) : (
                <span className="gallery-model-booster">×2</span>
              ))}
          </button>
          <span>{state}</span>
        </div>
      ))}
    </div>
  );
}

function TooltipExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="gallery-tooltip-example">
      <button
        type="button"
        className="gallery-control gallery-round-button"
        aria-label="Информация о роли"
        aria-describedby={open ? "gallery-role-tooltip" : undefined}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(!open)}
      >
        <CircleInfo width={20} height={20} />
      </button>
      <span
        className={`gallery-tooltip ${open ? "is-open" : ""}`}
        role="tooltip"
        id="gallery-role-tooltip"
      >
        Описание роли: пишет тексты под ваш запрос
      </span>
    </div>
  );
}

export function ComponentGallery({ onBack, imageUrl }) {
  const [mode, setMode] = useState("auto");
  const [roleInfo, setRoleInfo] = useState(false);
  const [picker, setPicker] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODELS.auto);

  return (
    <main className="component-gallery">
      <header className="gallery-header">
        <button
          type="button"
          className="gallery-control gallery-back"
          onClick={onBack}
        >
          <ArrowLeft width={18} height={18} />
          <span>Вернуться в чат</span>
        </button>
        <a
          className="gallery-link"
          href="https://www.figma.com/design/QMcURWZ326Z74o3Rb6IFhp/dashboard?node-id=2335-87500"
          target="_blank"
          rel="noreferrer"
        >
          Макеты в Figma
          <ChevronRight width={14} height={14} />
        </a>
      </header>
      <div className="gallery-body">
        <div className="gallery-title">
          <p>МОЛЕКУЛА · UX REWORK 09</p>
          <h1>Компоненты</h1>
          <span>
            Композер, настройки и все состояния — можно попробовать каждый
            элемент.
          </span>
        </div>
        <nav className="gallery-nav" aria-label="Разделы библиотеки">
          {[
            ["states", "Состояния"],
            ["blocks", "Опциональные блоки"],
            ["mobile", "Мобильная версия"],
            ["files", "Вложения"],
            ["settings", "Настройки"],
            ["primitives", "Компоненты"],
          ].map(([id, label]) => (
            <a className="gallery-link" href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>

        <Section
          number="01"
          id="states"
          title="Состояния поля"
          description="Пять типов генерации, пять состояний. Настройки и ввод работают в каждом примере."
        >
          <Tabs className="gallery-mode-tabs" label="Тип генерации" value={mode} onChange={setMode} items={MODES.map(id => ({ id, label: MODE_NAMES[id], icon: <ModeIcon mode={id}/> }))}/>
          <div className="gallery-grid">
            {STATES.map((state) => (
              <Example
                key={`${mode}-${state}`}
                title={state}
                description={STATE_COPY[state]}
              >
                <ComposerExample mode={mode} state={state} />
              </Example>
            ))}
          </div>
        </Section>

        <Section
          number="02"
          id="blocks"
          title="Опциональные блоки"
          description="Один слот верхней панели. Приоритет: оффер → роль → ассистент."
        >
          <div className="gallery-grid">
            <Example
              title="Assistant"
              description="Молли готова к запросу. Панель скрывается при начале ввода."
            >
              <ComposerExample showTopPanel />
            </Example>
            <Example
              title="Role"
              description="Выбранная роль, описание и удаление."
            >
              <ComposerExample
                mode="text"
                role="Сценарист Reels"
                showTopPanel
              />
            </Example>
            <Example
              title="Offer"
              description="Один оффер с таймером. После закрытия появляется следующая панель."
            >
              <ComposerExample showTopPanel offer role="Сценарист Reels" />
            </Example>
            <Example
              title="Файлы"
              description="Горизонтальный скролл и удаление вложений."
            >
              <ComposerExample
                mode="text"
                files={SAMPLE_FILES}
                imageUrl={imageUrl}
              />
            </Example>
            <Example
              title="Обязательные референсы"
              description="Отправка доступна после загрузки обязательного кадра."
            >
              <ComposerExample mode="video" state="Filled" requiredRefs />
            </Example>
            <Example
              title="Без футера"
              description="Тип и модель уже заданы контекстом чата."
            >
              <ComposerExample mode="text" showFooter={false} />
            </Example>
            <Example
              title="Без промо-плашки"
              description="Для платного тарифа или использованных бесплатных генераций."
            >
              <ComposerExample showPromo={false} />
            </Example>
          </div>
        </Section>

        <Section
          number="03"
          id="mobile"
          title="Мобильная раскладка"
          description="Ширина композера 342 px. Настройки открываются нижним листом, а отправка остаётся справа от скролла."
        >
          <div className="gallery-mobile-grid">
            {[
              ["Default", "auto"],
              ["Filled", "image"],
              ["Generating", "video"],
              ["Default", "text"],
            ].map(([state, type], index) => (
              <Example
                key={`${type}-${state}`}
                title={
                  index === 3
                    ? "Файлы + роль"
                    : `${MODE_NAMES[type]} · ${state}`
                }
              >
                <ComposerExample
                  mode={type}
                  state={state}
                  device="mobile"
                  requiredRefs={index === 2}
                  files={index === 3 ? SAMPLE_FILES : []}
                  role={index === 3 ? "Сценарист Reels" : ""}
                  showTopPanel={index === 3}
                />
              </Example>
            ))}
          </div>
        </Section>

        <Section
          number="04"
          id="files"
          title="Файлы и референсы"
          description="File · UploadRefCard. Крестик удаляет вложение; карточка открывает выбор файла."
        >
          <Example title="File · DOCX / PDF / MP4 / MP3 / IMAGE">
            <FileExamples imageUrl={imageUrl} />
          </Example>
          <Example title="UploadRefCard · Default / Hover / Uploaded / Error">
            <div className="gallery-reference-grid">
              {[
                ["default", "1:1"],
                ["hover", "1:1"],
                ["error", "1:1"],
                ["uploaded", "1:1"],
                ["default", "9:16"],
                ["default", "16:9"],
              ].map(([state, ratio], index) => (
                <RefExample
                  state={state}
                  ratio={ratio}
                  imageUrl={imageUrl}
                  key={index}
                />
              ))}
            </div>
          </Example>
        </Section>

        <Section
          number="05"
          id="settings"
          title="Настройки генерации"
          description="Кнопка «+» и быстрые действия используют общий стейт. На десктопе — поповер с подменю, на мобильном — один нижний лист."
        >
          <div className="gallery-grid">
            {MODES.map((type) => (
              <Example
                key={type}
                title={`${MODE_NAMES[type]} · Настройки`}
                description={`Модель по умолчанию — ${DEFAULT_MODELS[type]}.`}
              >
                <ComposerExample mode={type} showPromo={false} />
              </Example>
            ))}
          </div>
          <div className="gallery-action-examples">
            <button
              className="gallery-control gallery-action"
              type="button"
              onClick={() => setPicker(true)}
            >
              <ModeIcon mode="auto" />
              Выбрать модель
              <ChevronRight width={16} height={16} />
            </button>
            <button
              className="gallery-control gallery-action"
              type="button"
              onClick={() => setRoleInfo(true)}
            >
              <CircleInfo width={18} height={18} />
              Описание роли
              <ChevronRight width={16} height={16} />
            </button>
          </div>
        </Section>

        <Section
          number="06"
          id="primitives"
          title="Компоненты библиотеки"
          description="Типы, селекты, строки меню, бейджи, модель и подсказка из секции компонентов."
        >
          <Example title="ChatTypeIcon · Color / Mono">
            <div className="gallery-icon-families">
              {MODES.map((type) => (
                <div className="gallery-labeled-primitive" key={type}>
                  <div className="gallery-icon-pair">
                    <ModeIcon mode={type} />
                    <span className="gallery-mono">
                      <ModeIcon mode={type} />
                    </span>
                  </div>
                  <span>{MODE_NAMES[type]}</span>
                </div>
              ))}
            </div>
          </Example>
          <Example
            title="Select · Default / Descriptions / Disabled"
            description="Общий селект с поповером. Выбор работает мышью, касанием и клавиатурой."
          >
            <SelectExamples />
          </Example>
          <Example title="popover-button · md / sm × default / hover / selected × control">
            <div className="gallery-row-matrix">
              {["md", "sm"].flatMap((size) =>
                ["default", "hover", "selected"].map((variant) => (
                  <div
                    className="gallery-menu-variants"
                    key={`${size}-${variant}`}
                  >
                    <p>
                      {size} · {variant}
                    </p>
                    {["none", "checkbox", "radio", "switch"].map((control) => (
                      <RowExample
                        size={size}
                        variant={variant}
                        control={control}
                        key={control}
                      />
                    ))}
                  </div>
                )),
              )}
            </div>
          </Example>
          <Example title="badge · sm / md">
            <div className="gallery-badge-matrix">
              {[
                "primary",
                "secondary",
                "third",
                "error",
                "neutral",
                "dark",
              ].map((color) => (
                <div className="gallery-labeled-primitive" key={color}>
                  <div className="gallery-badge-pair">
                    <GalleryBadge color={color} />
                    <GalleryBadge color={color} size="md" />
                  </div>
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </Example>
          <Example title="model-row · loading / default / hover / selected">
            <PrimitiveModels />
          </Example>
          <Example title="tooltip">
            <TooltipExample />
          </Example>
        </Section>
        <footer className="gallery-footer">
          <span>Молекула · Композер и флоу чата</span>
          <button
            type="button"
            className="gallery-control gallery-footer-action"
            onClick={onBack}
          >
            Вернуться в чат
            <ArrowLeft width={14} height={14} />
          </button>
        </footer>
      </div>
      {picker && (
        <ModelPicker
          mode={mode}
          model={model}
          onClose={() => setPicker(false)}
          onSelect={(nextMode, name) => {
            setMode(nextMode);
            setModel(name);
            setPicker(false);
          }}
        />
      )}
      {roleInfo && (
        <RolesShowcase
          initialRole="Менеджер маркетплейсов"
          onClose={() => setRoleInfo(false)}
          onSelectRole={() => setRoleInfo(false)}
        />
      )}
    </main>
  );
}
