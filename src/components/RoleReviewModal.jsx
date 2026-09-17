import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "../ui";
import { useModalBehavior } from "./modal-behavior";
import { REVIEW_ASPECTS, REVIEW_MAX_LENGTH, createRoleReview } from "./role-feedback.js";
import "./role-review-modal.css";

/** Optional feedback after a like. Closing the form never removes the like. */
export function RoleReviewModal({ role, review, onClose, onSave }) {
  const id = useId();
  const [comment, setComment] = useState(review?.text || "");
  const [aspects, setAspects] = useState(review?.aspects || []);
  const [saved, setSaved] = useState(false);
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  const toggleAspect = aspect => setAspects(current => current.includes(aspect) ? current.filter(item => item !== aspect) : [...current, aspect]);
  function submit(event) {
    event.preventDefault();
    if (saved) return;
    const next = createRoleReview({ text: comment, aspects });
    if (!next) return;
    onSave(next);
    setSaved(true);
  }
  return createPortal(<div className="rr-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.currentTarget === event.target) requestClose(); }}>
    <section className="rr-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} ref={dialogRef} tabIndex={-1} data-closing={closing || undefined}>
      <div className="rr-grabber" aria-hidden="true" />
      <IconButton icon="close" label="Закрыть отзыв" className="rr-close" onClick={requestClose} />
      <img className="rr-avatar" src={role.image} width="112" height="112" alt="" />
      <header className="rr-heading" aria-live="polite">
        <h2 id={`${id}-title`}>{saved ? "Отзыв сохранён" : review ? "Ваш отзыв о роли" : "Спасибо за лайк!"}</h2>
        <p id={`${id}-description`}>{saved ? `Спасибо! Он виден в отзывах о роли «${role.name}» в этом браузере.` : `Расскажите, чем помогла роль «${role.name}».`}</p>
      </header>
      {saved ? <button type="button" className="rr-primary" onClick={requestClose}>Готово</button> : <form className="rr-form" onSubmit={submit}>
        <fieldset className="rr-aspects"><legend>Что понравилось</legend><div>{REVIEW_ASPECTS.map(aspect => <button type="button" key={aspect} aria-pressed={aspects.includes(aspect)} onClick={() => toggleAspect(aspect)}>{aspect}</button>)}</div></fieldset>
        <div className="rr-comment"><label htmlFor={`${id}-comment`}>Отзыв</label><textarea id={`${id}-comment`} aria-describedby={`${id}-note`} placeholder="Например: за вечер собрала промпты для 10 постов" value={comment} onChange={event => setComment(event.target.value)} maxLength={REVIEW_MAX_LENGTH} rows={3} /><div className="rr-note" id={`${id}-note`}><span>Отзыв сохранится в этом браузере</span><span>{comment.length}/{REVIEW_MAX_LENGTH}</span></div></div>
        <button type="submit" className="rr-primary" disabled={!comment.trim() && !aspects.length}>{review ? "Сохранить изменения" : "Отправить"}</button>
        <button type="button" className="rr-skip" onClick={requestClose}>Пропустить</button>
      </form>}
    </section>
  </div>, document.body);
}
