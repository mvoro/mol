import { withBasePath } from '../base-path.js';
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, ModelIcon } from "../ui.jsx";
import { TextInput } from "./TextInput.jsx";
import { useModalBehavior } from "./modal-behavior.js";
import "./auth-modal.css";

const media = withBasePath("/media/auth/");
export const authSlides = {
  photos: [
    {
      image: `${media}photo-01.png`,
      title: "Карточки товара",
      text: "Продающие фото без студии и съемки",
      label: "Карточки",
    },
    {
      image: `${media}photo-02.png`,
      title: "Рекламные креативы",
      text: "Найдите образ, который замечают",
      label: "Креативы",
    },
    {
      image: `${media}photo-04.png`,
      title: "Посты для соцсетей",
      text: "Визуал, который останавливает скролл",
      label: "Посты",
    },
    {
      image: `${media}photo-03.png`,
      title: "Портреты и фотосессии",
      text: "Примерьте новый свет, стиль и настроение",
      label: "Портреты",
    },
  ],
  models: [
    {
      video: `${media}gemini.mp4`,
      image: `${media}gemini.jpg`,
      title: "Gemini 3.1 Pro",
      text: "Соединяйте идеи и находите новые решения",
      label: "Gemini",
    },
    {
      video: `${media}chatgpt.mp4`,
      image: `${media}chatgpt.jpg`,
      title: "ChatGPT 5.5",
      text: "Пишите, учитесь и двигайтесь от идеи к плану",
      label: "ChatGPT",
    },
    {
      video: `${media}claude.mp4`,
      image: `${media}claude.jpg`,
      title: "Claude Sonnet 5",
      text: "Работайте с текстами, историями и кодом",
      label: "Claude",
    },
  ],
};

function SocialLogo({ provider }) {
  if (provider === "VK ID")
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="#07F" />
        <path
          fill="#fff"
          d="M25.3 34c-9.6 0-16-6.6-16-17.3h4.9c0 7.9 3.7 11.3 6.3 12V16.7h4.7v6.4c2.6-.3 5.4-3.3 6.3-6.4h4.6c-.7 3.8-3.6 6.8-5.6 8 2 1 5.3 3.6 6.6 8.3h-5.1c-1-3.2-3.5-5.7-6.8-6v6h-.6z"
        />
      </svg>
    );
  if (provider === "Яндекс")
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="24" fill="#FC3F1D" />
        <path
          fill="#fff"
          d="M27.6 13.5h-3.1c-3.6 0-6.3 2.4-6.3 6.5 0 2.7 1.2 4.6 3.3 6L17.3 34.5h3.6l4.4-9.8h1.6v9.8h3.1V13.5zm-3.6 8.9h-1c-1.7 0-3.4-1.1-3.4-3.6 0-2.6 1.5-3.7 3.2-3.7h1.2v7.3z"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M47 24.5c0-1.6-.1-3.1-.4-4.5H24v9h13c-.6 3-2.3 5.6-4.8 7.3v6h7.7C44.4 38.2 47 32 47 24.5z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.2 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-10H2.5v6.2C6.5 42.6 14.6 48 24 48z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.5c-.5-1.4-.8-3-.8-4.5s.3-3.1.8-4.5v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7z"
      />
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.5 13.3l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"
      />
    </svg>
  );
}

function AuthShowcase({ variant }) {
  const slides = authSlides[variant];
  const duration = variant === "models" ? 5000 : 8000;
  const [slide, setSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const surface = useRef(null);
  const videos = useRef([]);
  const elapsed = useRef(0);
  const previousSlide = useRef(-1);
  const paused =
    hovered || focusWithin || manualPaused || hidden || !visible || reduced;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    const visibility = () => setHidden(document.hidden);
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(surface.current);
    visibility();
    return () => {
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
      videos.current.forEach((video) => video?.pause());
    };
  }, []);

  useEffect(() => {
    elapsed.current = 0;
    setProgress(0);
  }, [slide]);
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - last;
      last = now;
      setProgress(Math.min(elapsed.current / duration, 1));
      if (elapsed.current >= duration)
        setSlide((current) => (current + 1) % slides.length);
    }, 100);
    return () => window.clearInterval(timer);
  }, [slide, paused, duration, slides.length]);

  useEffect(() => {
    const changed = previousSlide.current !== slide;
    previousSlide.current = slide;
    videos.current.forEach((video, index) => {
      if (!video) return;
      if (changed) video.currentTime = 0;
      if (index === slide && !paused) video.play().catch(() => {});
      else video.pause();
    });
  }, [slide, paused]);

  const choose = (index) => {
    elapsed.current = 0;
    setProgress(0);
    if (videos.current[index]) videos.current[index].currentTime = 0;
    setSlide(index);
  };
  return (
    <aside
      className="auth-showcase"
      ref={surface}
      aria-label="Что можно создать в Молекуле"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() =>
        setFocusWithin(document.body.dataset.input === "keyboard")
      }
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocusWithin(false);
      }}
    >
      {slides.map((item, index) =>
        item.video ? (
          <video
            key={item.video}
            ref={(node) => {
              videos.current[index] = node;
            }}
            className={`auth-slide-media${slide === index ? " is-current" : ""}`}
            src={item.video}
            poster={item.image}
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            aria-hidden="true"
            onCanPlay={(event) => {
              if (slide === index && !paused)
                event.currentTarget.play().catch(() => {});
            }}
          />
        ) : (
          <img
            key={item.image}
            className={`auth-slide-media${slide === index ? " is-current" : ""}`}
            src={item.image}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
          />
        ),
      )}
      <div className="auth-showcase-veil" />
      <div className="auth-showcase-brand">
        <ModelIcon model="Молли 1.0" size={24} />
        <span>Молекула</span>
      </div>
      {!reduced && (
        <button
          type="button"
          className="auth-showcase-pause"
          aria-label={
            manualPaused ? "Продолжить автопоказ" : "Приостановить автопоказ"
          }
          aria-pressed={manualPaused}
          onClick={() => setManualPaused((value) => !value)}
        >
          {manualPaused ? (
            <Icon name="play" size={14} />
          ) : (
            <Icon name="pause" size={14} />
          )}
        </button>
      )}
      <div className="auth-showcase-content">
        <div className="auth-showcase-copy">
          <h3>{slides[slide].title}</h3>
          <p>{slides[slide].text}</p>
        </div>
        <div className="auth-slide-steps" aria-label="Слайды">
          {slides.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-label={`Показать: ${item.title}`}
              aria-pressed={slide === index}
              onClick={() => choose(index)}
            >
              <span className="auth-step-track" aria-hidden="true">
                <span
                  style={{
                    transform: `scaleX(${index < slide ? 1 : index === slide ? (reduced ? 1 : progress) : 0})`,
                  }}
                />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function AuthModal({ onClose, onSuccess, mode = "auto" }) {
  const id = useId();
  const emailRef = useRef(null);
  const codeRef = useRef(null);
  const actionTimer = useRef(null);
  const actionPending = useRef(false);
  const completed = useRef(false);
  const completedAccount = useRef(null);
  const successRef = useRef(null);
  const [screen, setScreen] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendUntil, setResendUntil] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const { dialogRef, closing, requestClose } = useModalBehavior(() => {
    onClose?.();
    if (completedAccount.current) onSuccess?.(completedAccount.current);
  }, emailRef);
  const variant = mode === "auto" || mode === "text" ? "models" : "photos";

  useEffect(() => () => window.clearTimeout(actionTimer.current), []);
  useEffect(() => {
    if (!resendUntil) return;
    const update = () =>
      setCooldown(Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [resendUntil]);
  useEffect(() => {
    if (busy) return;
    if (screen === "code") codeRef.current?.focus({ preventScroll: true });
    if (screen === "success") successRef.current?.focus({ preventScroll: true });
  }, [screen, busy, error]);

  const run = (action) => {
    if (actionPending.current || closing) return;
    actionPending.current = true;
    setBusy(true);
    setError("");
    actionTimer.current = window.setTimeout(() => {
      actionPending.current = false;
      setBusy(false);
      action();
    }, 650);
  };
  const close = () => {
    window.clearTimeout(actionTimer.current);
    requestClose();
  };
  const back = () => {
    window.clearTimeout(actionTimer.current);
    actionPending.current = false;
    setBusy(false);
    setError("");
    setNotice("");
    setCode("");
    setScreen("email");
    window.setTimeout(
      () => emailRef.current?.focus({ preventScroll: true }),
      0,
    );
  };
  const enterEmail = (event) => {
    event.preventDefault();
    if (!emailRef.current?.reportValidity()) return;
    run(() => {
      setEmail((value) => value.trim());
      setCode("");
      setScreen("code");
      setNotice("");
      setResendUntil(Date.now() + 30000);
    });
  };
  const verify = (event) => {
    event.preventDefault();
    if (code.length !== 6) return;
    run(() => {
      if (code !== "123456") setError("Неверный демо-код. Попробуйте 123456.");
      else {
        setScreen("success");
        setNotice("");
      }
    });
  };

  const modal = (
    <div
      className="auth-modal-overlay"
      data-closing={closing || undefined}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        className={`auth-modal auth-screen-${screen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        data-closing={closing || undefined}
      >
        <AuthShowcase key={variant} variant={variant} />
        <button
          type="button"
          className="pill round auth-modal-close"
          aria-label="Закрыть вход"
          onClick={close}
        >
          <Icon name="close" size={16} />
        </button>
        <div className="auth-form">
          {screen === "code" && (
            <button
              type="button"
              className="pill round auth-back"
              aria-label="Изменить email"
              onClick={back}
            >
              <Icon name="arrowLeft" size={16} />
            </button>
          )}
          {screen === "email" && (
            <div className="auth-form-content">
              <header className="auth-heading">
                <span className="auth-free-badge">
                  <Icon name="gift" size={12} />
                  Пространство для ваших идей
                </span>
                <h2 id={`${id}-title`}>
                  {variant === "models"
                    ? "ChatGPT, Claude и Gemini — в одном окне"
                    : "Создавайте вместе с Молекулой"}
                </h2>
                <p>
                  {variant === "models"
                    ? "От короткого вопроса до большого проекта. Начните с того, что интересно вам."
                    : "Изображения, видео и музыка — от первого замысла к результату."}
                </p>
              </header>
              <div className="auth-methods">
                <div className="auth-socials">
                  {["VK ID", "Яндекс", "Google"].map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      className="pill auth-social"
                      disabled={busy}
                      onClick={() => {
                        setNotice(
                          `Вход через ${provider} пока не подключен. Попробуйте демо-вход по email ниже.`,
                        );
                        emailRef.current?.focus({ preventScroll: true });
                      }}
                    >
                      <SocialLogo provider={provider} />
                      <span>Войти через {provider}</span>
                    </button>
                  ))}
                </div>
                <div className="auth-divider">
                  <span />
                  или
                  <span />
                </div>
                <form className="auth-email-form" onSubmit={enterEmail}>
                  <label
                    className="auth-visually-hidden"
                    htmlFor={`${id}-email`}
                  >
                    Электронная почта
                  </label>
                  <TextInput
                    ref={emailRef}
                    id={`${id}-email`}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Электронная почта"
                    required
                    value={email}
                    disabled={busy}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setNotice("");
                    }}
                  />
                  <button
                    type="submit"
                    className="pill auth-cta"
                    disabled={!email.trim() || busy}
                    aria-busy={busy}
                  >
                    {busy ? (
                      <>
                        <span className="auth-spinner" />
                        Готовим демо-код…
                      </>
                    ) : (
                      "Продолжить"
                    )}
                  </button>
                </form>
              </div>
              {notice && (
                <p className="auth-notice" role="status">
                  {notice}
                </p>
              )}
              <p className="auth-demo-note">
                Демонстрация входа. Письмо не отправляется.
                <br />
                Демо-код: <strong>123456</strong>. Данные сохраняются в этом
                браузере.
              </p>
            </div>
          )}
          {screen === "code" && (
            <div className="auth-form-content">
              <header className="auth-heading">
                <span className="auth-code-icon">
                  <Icon name="check" size={22} />
                </span>
                <h2 id={`${id}-title`}>Введите демо-код</h2>
                <p>
                  Для <strong>{email}</strong>
                  <br />
                  Письмо не отправлялось. Введите <strong>123456</strong>, чтобы
                  продолжить.
                </p>
              </header>
              <form className="auth-code-form" onSubmit={verify}>
                <label htmlFor={`${id}-code`} className="auth-visually-hidden">
                  Шестизначный код
                </label>
                <TextInput
                  ref={codeRef}
                  id={`${id}-code`}
                  className="auth-code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  minLength={6}
                  required
                  value={code}
                  disabled={busy}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                />
                {error && (
                  <p id={`${id}-error`} className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="pill auth-cta"
                  disabled={code.length !== 6 || busy}
                  aria-busy={busy}
                >
                  {busy ? (
                    <>
                      <span className="auth-spinner" />
                      Проверяем код…
                    </>
                  ) : (
                    "Продолжить"
                  )}
                </button>
              </form>
              <button
                type="button"
                className="auth-resend"
                disabled={cooldown > 0 || busy}
                onClick={() => {
                  if (Date.now() < resendUntil) return;
                  setResendUntil(Date.now() + 30000);
                  setNotice(
                    "Демо-код снова готов: 123456. Письмо не отправлялось.",
                  );
                }}
              >
                {cooldown > 0
                  ? `Повторить через ${cooldown} с`
                  : "Получить демо-код еще раз"}
              </button>
              {notice && (
                <p className="auth-notice" role="status">
                  {notice}
                </p>
              )}
              <button
                type="button"
                className="pill auth-edit-email"
                onClick={back}
              >
                Изменить email
              </button>
            </div>
          )}
          {screen === "success" && (
            <div className="auth-form-content auth-success">
              <span className="auth-success-icon">
                <Icon name="check" size={30} />
              </span>
              <header className="auth-heading">
                <h2 id={`${id}-title`}>Можно начинать!</h2>
                <p>
                  Демо-профиль готов. Ваша следующая идея уже ждет в Молекуле.
                </p>
              </header>
              <button ref={successRef}
                type="button"
                className="pill auth-cta"
                onClick={() => {
                  if (completed.current) return;
                  completed.current = true;
                  completedAccount.current = {
                    name: email.split("@")[0],
                    email,
                  };
                  requestClose();
                }}
              >
                Начать создавать
                <Icon name="arrowRight" size={14} />
              </button>
              <p className="auth-demo-note">
                Это локальный демо-профиль. Настоящий аккаунт не создается.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
  return typeof document === "undefined"
    ? modal
    : createPortal(modal, document.body);
}
