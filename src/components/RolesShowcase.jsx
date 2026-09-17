import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Heart, Star } from "../outline-icons.jsx";
import { Icon, IconButton } from "../ui";
import { InputShell, TextInput } from "./TextInput";
import { useModalBehavior } from "./modal-behavior";
import { ROLE_CATALOG } from "./role-data.js";
import { useRoleFavorites } from "./useRoleFavorites.js";
import { Tabs } from "./Tabs.jsx";
import { RoleReviewModal } from "./RoleReviewModal.jsx";
import { saveRoleReview } from "./role-feedback.js";
import "./roles-showcase.css";

export const ROLE_CATEGORIES = [
  { id: "social", label: "Соцсети", description: "Контент, который хочется смотреть, читать и обсуждать.", colors: "#ffd3c2, #ffb49b, #ffc9e6" },
  { id: "texts", label: "Тексты", description: "От первой идеи до готового текста — под вашу задачу и тон.", colors: "#f5c6ff, #eba6ff, #d9cbff" },
  { id: "sales", label: "Продажи", description: "Позиционирование, воронки и общение с клиентами.", colors: "#dcccff, #c2a9ff, #c9daff" },
  { id: "analytics", label: "Аналитика", description: "Исследования, данные и понятные выводы для решений.", colors: "#c6dbff, #a3c6ff, #b7f0f2" },
  { id: "work", label: "Работа", description: "Помощники для ежедневных задач, команды и развития.", colors: "#ffe9c2, #ffd48f, #ffe0c9" },
  { id: "self", label: "Про себя", description: "Время для своих вопросов, привычек и новых взглядов.", colors: "#c2f7ea, #9df1dd, #d2f3ff" },
];
export const SHOWCASE_ROLES = ROLE_CATALOG;
const findRole = id => SHOWCASE_ROLES.find(role => role.id === id);
const categoryFor = role => ROLE_CATEGORIES.find(category => category.id === role.group);
const compactNumber = value => value >= 1000 ? `${(value / 1000).toFixed(1).replace(".", ",")}k` : String(value);
const LIKES_KEY = "molecula-role-likes-v1";
const USAGE_KEY = "molecula-role-usage-v1";
const REVIEWS_KEY = "molecula-role-reviews-v1";

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(fallback)) return Array.isArray(value) ? value.filter(item => typeof item === "string" && findRole(item)) : fallback;
    return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

function useSavedState(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback));
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep the current session usable when storage is unavailable. */ } }, [key, value]);
  return [value, setValue];
}

function RoleAvatar({ role, large = false }) {
  return <img className={`rs-avatar${large ? " rs-avatar-large" : ""}`} src={role.image} width={large ? 112 : 56} height={large ? 112 : 56} alt="" loading={large ? "eager" : "lazy"} />;
}

function LikeButton({ role, liked, onToggle, label = false }) {
  const count = role.likes + Number(liked);
  return <button type="button" className={`rs-like${liked ? " is-active" : ""}`} aria-label={`${liked ? "Убрать отметку «Нравится»" : "Нравится"}: ${role.name}`} aria-pressed={liked} onClick={onToggle}>
    <Heart className={`rs-heart${liked ? " is-filled" : ""}`} size={14} weight={liked ? "fill" : "regular"} aria-hidden="true" />
    {(label || count > 0) && <span>{label ? "Нравится" : compactNumber(count)}</span>}
  </button>;
}

function FavoriteButton({ role, favorite, onToggle, large = false }) {
  return <button type="button" className={`rs-favorite${favorite ? " is-active" : ""}${large ? " rs-favorite-large" : ""}`} aria-label={`${favorite ? "Убрать из избранного" : "Добавить в избранное"}: ${role.name}`} aria-pressed={favorite} onClick={onToggle}>
    <Star size={large ? 18 : 14} weight={favorite ? "fill" : "regular"} aria-hidden="true" />
  </button>;
}

function RoleCard({ role, favorite, liked, onFavorite, onLike, onOpen }) {
  return <article className="rs-card">
    <button type="button" className="rs-card-open" onClick={() => onOpen(role)} aria-label={`Открыть роль «${role.name}»`}>
      <RoleAvatar role={role} />
      <span className="rs-card-copy"><strong title={role.name}>{role.name}</strong><span>{role.description}</span></span>
    </button>
    <div className="rs-card-actions">
      <LikeButton role={role} liked={liked} onToggle={() => onLike(role.id)} />
      <FavoriteButton role={role} favorite={favorite} onToggle={() => onFavorite(role.id)} />
    </div>
  </article>;
}

function RolePreview({ role, liked, onLike, onStart, onDetails, onClose }) {
  const id = useId();
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  return createPortal(<div className="rs-preview-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.currentTarget === event.target) requestClose(); }}>
    <section className="rs-preview" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} ref={dialogRef} tabIndex={-1} data-closing={closing || undefined}>
      <div className="rs-preview-grabber" aria-hidden="true" />
      <IconButton icon="close" label="Закрыть описание роли" className="rs-preview-close" onClick={requestClose} />
      <RoleAvatar role={role} large />
      <div className="rs-preview-copy"><h2 id={`${id}-title`}>{role.name}</h2><p id={`${id}-description`}>{role.description}</p></div>
      <LikeButton role={role} liked={liked} onToggle={() => onLike(role.id)} />
      <button type="button" className="rs-primary rs-preview-start" onClick={() => onStart(role)}>Начать чат</button>
      <button type="button" className="rs-text-button" onClick={() => onDetails(role)}>Подробнее</button>
    </section>
  </div>, document.body);
}

const PROMPT_ABOUT = [
  "Роль для тех, кто работает с нейросетями каждый день и устал от нестабильных ответов. Промпт Инженер разбирает вашу задачу, задаёт уточняющие вопросы и собирает промпт со структурой: роль, контекст, формат ответа, ограничения и примеры.",
  "Умеет чинить чужие промпты: находит, из-за чего модель уходит в сторону, и показывает до и после с объяснением, что изменилось и почему. Для повторяющихся задач собирает шаблоны с переменными, которые можно раздать команде.",
];
const PROMPT_STEPS = [
  "Опишите задачу и вставьте текущий промпт, если он есть — даже плохой ускорит работу.",
  "Ответьте на 2–3 уточняющих вопроса: для какой модели, какой формат ответа нужен.",
  "Получите промпт с пояснением каждого блока — что за что отвечает.",
  "Прогоните на реальном примере и вернитесь с результатом: роль доведёт до стабильного.",
];
const DEFAULT_STEPS = [
  "Опишите свою задачу: что нужно получить и для кого вы это делаете.",
  "Добавьте исходные материалы, примеры и ограничения по формату.",
  "Ответьте на уточняющие вопросы и получите первый вариант.",
  "Расскажите, что стоит изменить: роль учтёт обратную связь и контекст диалога.",
];
const PROMPT_REVIEWS = [
  { name: "Марина К.", date: "12 авг", text: "Дала свой промпт для описаний товаров — переписала так, что выдача стала стабильнее. Заодно объяснила, что именно было не так." },
  { name: "Дмитрий", date: "3 авг", text: "Просил собрать промпт для разбора звонков менеджеров. Задала три уточняющих вопроса и выдала готовый шаблон с переменными." },
  { name: "Олег С.", date: "28 июл", text: "Хорошо структурирует. Иногда предлагает слишком длинные варианты, приходится просить сократить." },
  { name: "Аня", date: "19 июл", text: "Люблю за то, что показывает два варианта промпта и объясняет разницу между ними." },
  { name: "Игорь", date: "6 июл", text: "Ожидал больше про промпты для картинок — она заметно сильнее в текстовых задачах." },
];

function RoleDetail({ role, favorites, likes, usage, savedReviews, onFavorite, onLike, onStart, onBack, onPreview, onSaveReview }) {
  const [allReviews, setAllReviews] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const category = categoryFor(role);
  const isPrompt = role.id === "prompt-engineer";
  const about = isPrompt ? PROMPT_ABOUT : [role.description + ".", `Поможет разобрать вашу задачу, предложит варианты и подготовит результат с учётом аудитории, контекста и нужного формата. Начните с одного из примеров или расскажите, что хотите сделать.`];
  const ownReviews = Array.isArray(savedReviews[role.id]) ? savedReviews[role.id] : [];
  const ownReview = ownReviews.find(review => review?.name === "Вы");
  const reviews = [...ownReviews, ...(isPrompt ? PROMPT_REVIEWS : [])].filter(review => review && (review.text || review.aspects?.length));
  const similar = SHOWCASE_ROLES.filter(item => item.group === role.group && item.id !== role.id).slice(0, 3);
  const hasUsed = Number(usage[role.id] || 0) > 0;
  const liked = likes.includes(role.id);
  function rateRole() {
    onLike(role.id);
    if (!liked) setFeedbackOpen(true);
  }
  return <div className="rs-detail">
    <button type="button" className="rs-back" onClick={() => onBack()}><Icon name="arrowLeft" size={14} />Ко всем ролям</button>
    <header className="rs-detail-heading">
      <RoleAvatar role={role} />
      <div className="rs-detail-title"><h1 tabIndex={-1}>{role.name}</h1><p>{role.description}</p></div>
      <div className="rs-detail-actions"><button type="button" className="rs-primary" onClick={() => onStart(role)}>Начать чат с ролью</button><FavoriteButton role={role} favorite={favorites.includes(role.id)} onToggle={() => onFavorite(role.id)} large /></div>
    </header>
    <div className="rs-metrics"><span><Heart className="rs-heart is-filled" size={14} weight="fill" aria-label="Нравится" role="img" />{compactNumber(role.likes + Number(liked))}</span><span>{compactNumber(role.runs + Number(usage[role.id] || 0))} запусков</span><span>{role.favorites + Number(favorites.includes(role.id))} в избранном</span><button type="button" onClick={() => onBack(role.group)}>{category.label}</button></div>
    <div className="rs-examples" style={{ "--role-gradient": `linear-gradient(139.2deg, ${category.colors})` }} aria-label="Примеры запросов">
      {role.prompts.map(prompt => <button type="button" className="rs-example" key={prompt} onClick={() => onStart(role, prompt)}><span>{prompt}</span><span className="rs-example-send"><ArrowRight size={14} weight="regular" aria-hidden="true" /></span></button>)}
    </div>
    <section className="rs-detail-section"><h2>Что умеет</h2>{about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>
    <section className="rs-detail-section"><h2>Как с ней работать</h2><ol className="rs-steps">{(isPrompt ? PROMPT_STEPS : DEFAULT_STEPS).map(step => <li key={step}>{step}</li>)}</ol></section>
    {hasUsed && <section className="rs-feedback" aria-label="Ваша оценка роли">
      <div className="rs-feedback-heading"><div><h2>Как вам роль «{role.name}»?</h2><p>{ownReview ? "Спасибо! Ваш отзыв сохранён." : "Вы уже работали с этой ролью"}</p></div><div className="rs-feedback-actions"><LikeButton role={role} liked={liked} onToggle={rateRole} label />{liked && <button type="button" className="rs-text-button" onClick={() => setFeedbackOpen(true)}>{ownReview ? "Изменить отзыв" : "Оставить отзыв"}</button>}</div></div>
    </section>}
    {feedbackOpen && <RoleReviewModal role={role} review={ownReview} onClose={() => setFeedbackOpen(false)} onSave={review => onSaveReview(role.id, review)} />}
    <section className="rs-reviews">
      <div className="rs-review-summary"><h2>Отзывы</h2><strong><Heart className="rs-heart is-filled rs-heart-large" size={28} weight="fill" aria-label="Нравится" role="img" />{compactNumber(role.likes + Number(liked))}</strong><p>{compactNumber(role.runs + Number(usage[role.id] || 0))} запусков · {reviews.length} отзывов</p></div>
      <div className="rs-review-list">{reviews.length ? <>{(allReviews ? reviews : reviews.slice(0, 3)).map((review, index) => <article className="rs-review" key={`${review.name}-${index}`}><header><strong>{review.name}</strong><time>{review.date}</time></header>{review.text && <p>{review.text}</p>}{review.aspects?.length > 0 && <div className="rs-review-aspects">{review.aspects.map(aspect => <span key={aspect}>{aspect}</span>)}</div>}</article>)}{reviews.length > 3 && <button type="button" className="rs-text-button rs-reviews-more" aria-expanded={allReviews} onClick={() => setAllReviews(value => !value)}>{allReviews ? "Свернуть отзывы" : `Показать все отзывы (${reviews.length})`}</button>}</> : <p className="rs-muted">Здесь появятся отзывы о работе с ролью.</p>}</div>
    </section>
    <section className="rs-section"><header className="rs-section-heading"><h2>Похожие роли</h2></header><div className="rs-grid">{similar.map(item => <RoleCard key={item.id} role={item} favorite={favorites.includes(item.id)} liked={likes.includes(item.id)} onFavorite={onFavorite} onLike={onLike} onOpen={onPreview} />)}</div></section>
  </div>;
}

function RolesCatalog({ onSelectRole, onBack, onClose, initialRole }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detail, setDetail] = useState(initialRole || null);
  const [favorites, setFavorites] = useRoleFavorites();
  const [likes, setLikes] = useSavedState(LIKES_KEY, []);
  const [usage, setUsage] = useSavedState(USAGE_KEY, {});
  const [reviews, setReviews] = useSavedState(REVIEWS_KEY, {});
  const scrollRef = useRef(null);
  const queryText = query.trim().toLocaleLowerCase("ru");
  const matches = useMemo(() => SHOWCASE_ROLES.filter(role => (!category || role.group === category) && (!queryText || `${role.name} ${role.description} ${categoryFor(role).label}`.toLocaleLowerCase("ru").includes(queryText))), [queryText, category]);
  const favoriteMatches = matches.filter(role => favorites.includes(role.id));
  const otherMatches = matches.filter(role => !favorites.includes(role.id));
  const toggleSaved = setter => id => setter(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const onFavorite = toggleSaved(setFavorites);
  const onLike = toggleSaved(setLikes);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    scrollRef.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, [detail?.id, category]);
  function startRole(role, prompt) {
    const nextUsage = { ...usage, [role.id]: Number(usage[role.id] || 0) + 1 };
    setUsage(nextUsage);
    try { localStorage.setItem(USAGE_KEY, JSON.stringify(nextUsage)); } catch { /* Keep session state usable. */ }
    onSelectRole?.(role.name, prompt);
  }
  function showCategory(id = null) { setCategory(id); setDetail(null); setQuery(""); }
  function renderCards(roles) {
    return <div className="rs-grid">{roles.map(role => <RoleCard key={role.id} role={role} favorite={favorites.includes(role.id)} liked={likes.includes(role.id)} onFavorite={onFavorite} onLike={onLike} onOpen={setPreview} />)}</div>;
  }
  function renderSection(title, roles) {
    if (!roles.length) return null;
    return <section className="rs-section" key={title}><header className="rs-section-heading"><h2>{title}</h2></header>{renderCards(roles)}</section>;
  }
  return <div className={`roles-showcase${onClose ? " rs-in-modal" : ""}`}>
    {!detail && <header className="rs-picker-header">
      <h1 className="rs-visually-hidden">Витрина ролей</h1>
      <Tabs items={[{ id: "all", label: "Все" }, ...ROLE_CATEGORIES]} value={category || "all"} onChange={value => showCategory(value === "all" ? null : value)} label="Категории ролей" className="rs-category-tabs" />
      <InputShell className="rs-search"><TextInput variant="bare" placeholder="Быстрый поиск роли" aria-label="Поиск ролей" value={query} onChange={event => setQuery(event.target.value)} />{query ? <IconButton icon="close" label="Очистить поиск ролей" onClick={() => setQuery("")} /> : <Icon name="search" size={16} />}</InputShell>
      {onClose && <IconButton icon="close" label="Закрыть витрину ролей" className="rs-modal-close" onClick={onClose} />}
    </header>}
    {detail && onClose && <IconButton icon="close" label="Закрыть витрину ролей" className="rs-modal-close rs-detail-close" onClick={onClose} />}
    <div className="rs-catalog-scroll" ref={scrollRef}><div className="rs-content">
      {detail ? <RoleDetail key={detail.id} role={detail} favorites={favorites} likes={likes} usage={usage} savedReviews={reviews} onFavorite={onFavorite} onLike={onLike} onStart={startRole} onBack={showCategory} onPreview={setDetail} onSaveReview={(id, review) => setReviews(current => saveRoleReview(current, id, review))} /> : <>
        {queryText && <p className="rs-results-count" role="status">По запросу «{query.trim()}»: {matches.length}</p>}
        {matches.length ? <>{renderSection("Избранные", favoriteMatches)}{renderSection(category ? ROLE_CATEGORIES.find(item => item.id === category)?.label : "Все роли", otherMatches)}</> : <div className="rs-empty"><Icon name="search" size={32} /><h2>Ничего не нашлось</h2><p>Попробуйте другое название или опишите задачу.</p><button type="button" className="rs-secondary" onClick={() => showCategory()}>Показать все роли</button></div>}
        {onBack && !onClose && <button type="button" className="rs-back rs-return-chat" onClick={onBack}><Icon name="arrowLeft" size={14} />Вернуться в чат</button>}
      </>}
    </div></div>
    {preview && <RolePreview role={preview} liked={likes.includes(preview.id)} onLike={onLike} onStart={startRole} onDetails={role => { setPreview(null); setDetail(role); }} onClose={() => setPreview(null)} />}
  </div>;
}

function RolesDialog({ onClose, ...props }) {
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  return createPortal(<div className="rs-modal-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.currentTarget === event.target) requestClose(); }}>
    <section className="rs-modal" role="dialog" aria-modal="true" aria-label="Витрина ролей" ref={dialogRef} tabIndex={-1} data-closing={closing || undefined}>
      <div className="rs-modal-grabber" aria-hidden="true" />
      <RolesCatalog {...props} onClose={requestClose} />
    </section>
  </div>, document.body);
}

export function RolesShowcase(props) {
  return props.onClose ? <RolesDialog {...props} /> : <RolesCatalog {...props} />;
}

export default RolesShowcase;
