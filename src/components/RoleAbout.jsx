import { useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../ui";
import { resolveCatalogRole } from "./role-data.js";
import { useModalBehavior } from "./modal-behavior";
import "./role-about.css";

export const DEFAULT_ROLE_ABOUT = {
  name: "Контент-менеджер маркетплейсов",
  tagline:
    "Превращаю карточки в «магниты» — для покупателей и для алгоритмов поиска.",
  skills: [
    [
      "SEO · видимость",
      "Семантическое ядро · заголовки без спама · описания под боли клиента · атрибуты для фильтров",
    ],
    [
      "Визуал · CTR",
      "Обложка, заметная в выдаче · инфографика · Rich-контент · видеообзоры",
    ],
    [
      "Конверсия · CR",
      "Отзывы и вопросы · узкие места воронки · A/B-тесты обложек и заголовков",
    ],
  ],
  exampleBefore: "«Чехол для айфона 15»",
  exampleAfter:
    "«Чехол для iPhone 15 Pro Max, силиконовый противоударный бампер с защитой камеры»",
  exampleNote:
    "Плюс УТП на главном фото и ответы на частые вопросы в описании. Позиции и CTR смотрим через 7 дней.",
  hints: [
    "Оптимизировать карточку с нуля",
    "Прокачать инфографику",
    "SEO-ядро для категории",
  ],
  footerText: "Пришлите ссылку на карточку или опишите товар — разберём.",
};

export function resolveRoleAbout(role) {
  if (role && typeof role === "object") {
    const base = role.name || role.id ? resolveRoleAbout(role.name || role.id) : DEFAULT_ROLE_ABOUT;
    return { ...base, ...role, tagline: role.tagline || role.description || base.tagline, hints: role.hints || role.prompts || base.hints };
  }
  if (!role || role === "Без роли") return DEFAULT_ROLE_ABOUT;
  const data = resolveCatalogRole(role);
  if (data) {
    return {
      ...(data.id === "marketplace-content" ? DEFAULT_ROLE_ABOUT : {}),
      name: data.name,
      tagline: data.description,
      image: data.image,
      hints: data.prompts,
      footerText: "Выберите пример запроса или расскажите о своей задаче в чате.",
    };
  }
  return {
    name: role,
    tagline: `Помогаю решать задачи в роли «${role}». Учитываю вашу цель, контекст и нужный формат результата.`,
    skills: [
      [
        "Разбор задачи",
        "Уточняю цель, аудиторию и ограничения, чтобы предложить подходящее решение",
      ],
      [
        "Готовый результат",
        "Готовлю структурированный ответ и конкретные варианты для вашей задачи",
      ],
      [
        "Доработка",
        "Учитываю обратную связь и уточнения, сохраняю контекст диалога",
      ],
    ],
    hints: [
      "Разобрать мою задачу",
      "Предложить несколько вариантов",
      "Улучшить готовый результат",
    ],
    footerText: "Расскажите о задаче и добавьте исходные материалы — начнём.",
  };
}

export function RoleAbout({ role, onClose, onUse }) {
  const id = useId();
  const data = useMemo(() => resolveRoleAbout(role), [role]);
  const hintUsed = useRef(false);
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  const useHint = (hint) => {
    if (hintUsed.current || closing) return;
    hintUsed.current = true;
    onUse?.(hint);
    requestClose();
  };

  return createPortal(
    <div
      className="ra-overlay"
      data-closing={closing || undefined}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        className="ra-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-tagline`}
        ref={dialogRef}
        tabIndex={-1}
        data-closing={closing || undefined}
      >
        <div className="ra-grabber" aria-hidden="true">
          <span />
        </div>
        <div className="ra-mobile-header">
          <span>{data.name}</span>
        </div>
        <button
          type="button"
          className="ra-close"
          onClick={requestClose}
          aria-label="Закрыть описание роли"
        >
          <Icon name="close" size={20} />
        </button>
        <div className="ra-scroll">
          <div className="ra-content">
            <header className={`ra-heading${data.image ? " ra-heading-with-avatar" : ""}`}>
              {data.image && <img className="ra-role-avatar" src={data.image} width="56" height="56" alt="" />}
              <div className="ra-heading-copy">
                <h2 id={`${id}-title`}>{data.name}</h2>
                <p id={`${id}-tagline`}>{data.tagline}</p>
              </div>
            </header>
            {!!data.skills?.length && <section className="ra-skills" aria-labelledby={`${id}-skills`}>
              <h3 id={`${id}-skills`} className="ra-caption">
                Что умею
              </h3>
              {data.skills?.map(([title, description]) => (
                <div className="ra-skill" key={title}>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              ))}
            </section>}
            {data.exampleBefore && data.exampleAfter && (
              <section className="ra-example" aria-labelledby={`${id}-example`}>
                <h3 id={`${id}-example`} className="ra-caption">
                  Пример работы
                </h3>
                <div className="ra-example-row">
                  <span>Было</span>
                  <p>{data.exampleBefore}</p>
                </div>
                <div className="ra-example-row">
                  <span>Стало</span>
                  <p>{data.exampleAfter}</p>
                </div>
                {data.exampleNote && (
                  <p className="ra-example-note">{data.exampleNote}</p>
                )}
              </section>
            )}
            {!!data.hints?.length && (
              <section className="ra-hints" aria-labelledby={`${id}-hints`}>
                <h3 id={`${id}-hints`} className="ra-caption">
                  С чем приходят
                </h3>
                <div className="ra-hint-items">
                  {data.hints.map((hint) => (
                    <button
                      type="button"
                      key={hint}
                      onClick={() => useHint(hint)}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {data.footerText && (
              <footer className="ra-footer">
                <p>{data.footerText}</p>
              </footer>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default RoleAbout;
