import { withBasePath } from '../base-path.js';
import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui.jsx';
import { Tabs } from './Tabs.jsx';
import { useModalBehavior } from './modal-behavior.js';
import './billing-modal.css';

const ASSET = withBasePath('/figma/notifications-billing/');
export const BILLING_PLANS = [
  { id: 'pro', name: 'Про', tokens: 2000, price: 1649 },
  { id: 'expert', name: 'Эксперт', tokens: 10000, price: 3970, originalPrice: 7940 },
  { id: 'maximum', name: 'Максимум', tokens: 20000, price: 16650 },
];
const formatNumber = value => new Intl.NumberFormat('ru-RU').format(value);
const priceLabel = value => `${formatNumber(value)} ₽`;
const FEATURES = [
  { icon: 'text', title: 'Текстовые модели', description: 'Claude Opus 5 и Sonnet 5, ChatGPT-5.5, Gemini 3.1 Pro, DeepSeek V4 и другие — в одном окне, без VPN и отдельных подписок' },
  { icon: 'files', title: 'Картинки без ограничений', description: 'Nano Banana Pro, GPT Image 2, Midjourney, Flux 1.1 PRO, Seedream 4.5, Ideogram v3' },
  { icon: 'video', title: 'Видео из текста и фото', description: 'Veo 3.1, Kling 3.0, Seedance 2.0, Hailuo 02 — генерация из текста и по фото' },
  { icon: 'music', title: 'Музыка и озвучка', description: 'Suno V5, V4.5 Plus, ElevenLabs Sound Effects, транскрибация голоса — генерация треков, звуковых эффектов и озвучки' },
];

function Reviews({ className = '' }) {
  return <div className={`billing-reviews ${className}`}>
    <div className="billing-avatars" aria-hidden="true">{['29b94.png', '69ebe.png', 'de4de.png', 'b11ea.png'].map(file => <img key={file} src={ASSET + 'notif-final-0-' + file} width="32" height="32" alt="" />)}</div>
    <div><div className="billing-rating"><span className="billing-rating-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Icon key={index} name="star" size={13} filled/>)}</span><strong>4,8</strong></div><span>Оценка 15 000+ пользователей</span></div>
  </div>;
}

function CheckoutFooter({ plan, onContinue, className = '' }) {
  return <div className={`billing-checkout ${className}`}>
    <div className="billing-total"><span>Итого к оплате:</span><div>{plan.originalPrice && <del>{priceLabel(plan.originalPrice)}</del>}<strong>{priceLabel(plan.price)}</strong></div></div>
    <button type="button" className="billing-primary" onClick={onContinue}>Открыть доступ за {priceLabel(plan.price)}</button>
    <div className="billing-guarantees">
      <span><Icon name="check" size={16} />Отмена в один клик в настройках</span>
      <span><Icon name="check" size={16} />Карты российских и зарубежных банков, СБП</span>
    </div>
  </div>;
}

/** Local preview only: choosing a plan opens a payment summary and never changes the balance. */
export function BillingModal({ onClose, balance = 5, initialPlan = 'pro' }) {
  const id = useId();
  const [planId, setPlanId] = useState(initialPlan);
  const [checkout, setCheckout] = useState(false);
  const plan = BILLING_PLANS.find(item => item.id === planId) || BILLING_PLANS[0];
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  const proceed = () => { setCheckout(true); dialogRef.current?.focus({ preventScroll: true }); };
  return createPortal(<div className="billing-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <section ref={dialogRef} className={`billing-modal${checkout ? ' is-checkout' : ''}`} data-closing={closing || undefined} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}>
      <img className="billing-backdrop-art" src={ASSET + 'billing-background.png'} alt="" aria-hidden="true" />
      <button type="button" className="billing-close icon-button" aria-label="Закрыть тарифы" onClick={requestClose}><Icon name="close" size={14} /></button>
      {checkout ? <div className="billing-payment">
        <button className="billing-back" type="button" onClick={() => { setCheckout(false); dialogRef.current?.focus({ preventScroll: true }); }}><Icon name="arrowLeft" size={16} />К тарифам</button>
        <h2 id={`${id}-title`}>Подписка «{plan.name}»</h2>
        <p className="billing-payment-description">{formatNumber(plan.tokens)} токенов каждый месяц и доступ к 65+ ИИ-моделям</p>
        <dl className="billing-payment-details"><div><dt>Тариф</dt><dd>{plan.name}</dd></div><div><dt>К оплате</dt><dd>{priceLabel(plan.price)}</dd></div><div><dt>Текущий баланс</dt><dd>{formatNumber(balance)} MC</dd></div></dl>
        <div className="billing-payment-notice" role="status"><Icon name="info" size={20} /><div><strong>Оплата пока недоступна</strong><p>Это предварительный просмотр подписки. Платёжный сервис ещё не подключён; деньги не списываются.</p></div></div>
        <button type="button" className="billing-primary" onClick={requestClose}>Вернуться в чат</button>
      </div> : <>
        <div className="billing-scroll">
          <div className="billing-plan-card">
            <div className="billing-plan-tabs"><Tabs label="Тариф" value={plan.id} onChange={setPlanId} items={BILLING_PLANS.map(item => ({ id: item.id, label: item.name }))} /><span className="billing-discount" aria-label="На тариф Эксперт скидка 50 процентов">50% OFF</span></div>
            <div className="billing-heading"><h2 id={`${id}-title`}>Все топовые нейросети<br />в тарифе <span>«{plan.name}»</span></h2><p>Без VPN, зарубежных карт и счетов<br />в разных сервисах</p></div>
            <div className="billing-allowance">
              <div><span><strong>{formatNumber(plan.tokens)} токенов</strong><small>каждый месяц</small></span><img src={ASSET + 'notif-final-0-f7931.svg'} width="20" height="20" alt="" /></div>
              <div><span><strong>65+ ИИ-моделей</strong><small>текст, картинки, видео, аудио</small></span><span className="billing-models" aria-hidden="true">{['79cde.svg', '93a51.svg', '0fe1c.svg'].map(file => <img key={file} src={ASSET + 'notif-final-0-' + file} width="20" height="20" alt="" />)}</span></div>
            </div>
            <CheckoutFooter className="billing-desktop-checkout" plan={plan} onContinue={proceed} />
            <p className="billing-legal billing-desktop-legal">Продолжая, вы соглашаетесь с <span>политикой конфиденциальности</span> и <span>пользовательским соглашением</span>.</p>
            <Reviews className="billing-mobile-reviews" />
          </div>
          <aside className="billing-benefits" aria-label="Что входит в подписку">
            <div className="billing-feature-list">{FEATURES.map(feature => <div className="billing-feature" key={feature.icon}><span className="billing-feature-icon"><Icon name={feature.icon} size={18}/></span><div><h3>{feature.title}</h3><p>{feature.description}</p></div></div>)}</div>
            <div className="billing-review-divider" />
            <Reviews className="billing-desktop-reviews" />
            <p className="billing-legal billing-mobile-legal">Продолжая, вы соглашаетесь с <span>политикой конфиденциальности</span> и <span>пользовательским соглашением</span>.</p>
          </aside>
        </div>
        <CheckoutFooter className="billing-mobile-checkout" plan={plan} onContinue={proceed} />
      </>}
    </section>
  </div>, document.body);
}
