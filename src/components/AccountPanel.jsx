import React, { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, ModeIcon } from "../ui.jsx";
import { TextInput } from "./TextInput.jsx";
import { useModalBehavior } from "./modal-behavior.js";
import "./account-panel.css";

const titles = {
  profile: "Профиль",
  community: "Вдохновение и сообщество",
  subscription: "Подписка",
  settings: "Настройки",
  help: "Помощь",
};

const examples = [
  ["image", "Изображения", "Визуальные идеи и готовые запросы"],
  ["video", "Видео", "Сюжеты, движение и короткие ролики"],
  ["audio", "Аудио", "Музыка, голоса и настроение"],
];

const questions = [
  [
    "Как выбрать модель?",
    "Выберите тип чата внизу композера, затем нажмите на название модели. В текстовом чате карточки над полем помогут начать с подходящего запроса.",
  ],
  [
    "Где найти мои диалоги?",
    "Диалоги находятся в истории сайдбара. Чаты, связанные с проектом, также доступны внутри его папки. Выбрать проект можно в верхней части рабочего пространства.",
  ],
  [
    "Как прикрепить файл?",
    "Нажмите «+» в композере и выберите «Добавить фото или файл». Также можно перетащить файл прямо в поле сообщения.",
  ],
  [
    "Как остановить генерацию?",
    "Во время генерации кнопка отправки превращается в кнопку остановки. Нажмите на нее, чтобы остановить текущий ответ и продолжить работу.",
  ],
];

export function AccountPanel({
  section = "profile",
  account = null,
  preferences = { sendOnEnter: true },
  onSaveAccount,
  onPreferencesChange,
  onClose,
  onExplore,
  onAuth,
}) {
  const id = useId();
  const nameRef = useRef(null);
  const pendingAction = useRef(null);
  const [name, setName] = useState(account?.name || "");
  const title = titles[section] || titles.profile;
  const { dialogRef, closing, requestClose } = useModalBehavior(
    () => {
      onClose?.();
      pendingAction.current?.();
    },
    section === "profile" && account ? nameRef : undefined,
  );
  const nameValid = name.trim().length > 0 && name.trim().length <= 60;
  const sendOnEnter = preferences.sendOnEnter !== false;

  const leaveWith = (action) => {
    if (closing) return;
    pendingAction.current = action;
    requestClose();
  };

  const panel = (
    <div
      className="account-panel-overlay"
      data-closing={closing || undefined}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        ref={dialogRef}
        className="account-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        data-closing={closing || undefined}
      >
        <header className="account-panel-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button
            type="button"
            className="pill round account-panel-close"
            aria-label="Закрыть окно"
            onClick={requestClose}
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        {section === "profile" &&
          (account ? (
            <form
              className="account-panel-body"
              onSubmit={(event) => {
                event.preventDefault();
                if (!nameValid || closing) return;
                onSaveAccount?.({ ...account, name: name.trim() });
                requestClose();
              }}
            >
              <label className="account-panel-field" htmlFor={`${id}-name`}>
                <span>Имя</span>
                <TextInput
                  ref={nameRef}
                  id={`${id}-name`}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  required
                  placeholder="Как к вам обращаться"
                />
              </label>
              <label className="account-panel-field" htmlFor={`${id}-email`}>
                <span>Электронная почта</span>
                <TextInput
                  id={`${id}-email`}
                  value={account.email || "Не указана"}
                  readOnly
                  autoComplete="email"
                />
              </label>
              <footer className="account-panel-actions">
                <button
                  type="button"
                  className="pill account-panel-button"
                  onClick={requestClose}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="pill account-panel-button account-panel-primary"
                  disabled={!nameValid || closing}
                >
                  Сохранить
                </button>
              </footer>
            </form>
          ) : (
            <div className="account-panel-body">
              <p className="account-panel-copy">
                Войдите, чтобы настроить свой профиль и продолжить создавать в
                Молекуле.
              </p>
              <button
                type="button"
                className="pill account-panel-button account-panel-primary"
                onClick={() => leaveWith(onAuth)}
              >
                Войти
              </button>
            </div>
          ))}

        {section === "settings" && (
          <div className="account-panel-body">
            <div className="account-setting">
              <div>
                <strong id={`${id}-enter`}>Отправлять по Enter</strong>
                <p id={`${id}-enter-help`}>
                  {sendOnEnter
                    ? "Shift + Enter — новая строка"
                    : "Enter — новая строка. Отправка кнопкой."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                className="account-switch"
                aria-labelledby={`${id}-enter`}
                aria-describedby={`${id}-enter-help`}
                aria-checked={sendOnEnter}
                onClick={() =>
                  onPreferencesChange?.({
                    ...preferences,
                    sendOnEnter: !sendOnEnter,
                  })
                }
              >
                <span />
              </button>
            </div>
            <p className="account-panel-note">
              Настройка применяется ко всем чатам.
            </p>
          </div>
        )}

        {section === "community" && (
          <div className="account-panel-body">
            <p className="account-panel-copy">
              Начните с примера: выберите направление, найдите идею и
              адаптируйте запрос под себя.
            </p>
            <div className="account-examples">
              {examples.map(([mode, label, description]) => (
                <button
                  type="button"
                  key={mode}
                  className="account-example"
                  onClick={() => leaveWith(() => onExplore?.(mode))}
                >
                  <ModeIcon mode={mode} size={24} />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <Icon name="external" size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {section === "subscription" && (
          <div className="account-panel-body">
            <div className="account-plan">
              <div>
                <strong>Бесплатный доступ</strong>
                <span className="account-plan-badge">5 MC</span>
              </div>
              <p>Попробуйте первые запросы и найдите свой формат.</p>
            </div>
            <div className="account-plan">
              <div>
                <strong>Pro</strong>
                <span className="account-plan-badge account-plan-badge-pro">
                  PRO
                </span>
              </div>
              <p>
                Для регулярной работы с нейросетями. Условия и доступные пакеты
                появятся здесь.
              </p>
            </div>
            <button
              type="button"
              className="pill account-panel-button"
              onClick={requestClose}
            >
              Понятно
            </button>
          </div>
        )}

        {section === "help" && (
          <div className="account-faq">
            {questions.map(([question, answer], index) => (
              <details key={question} open={index === 0 ? true : undefined}>
                <summary tabIndex={0}>
                  {question}
                  <Icon name="chevron" size={12} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  return typeof document === "undefined"
    ? panel
    : createPortal(panel, document.body);
}
