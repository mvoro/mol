import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, ModeIcon } from '../ui.jsx';
import { getNotificationIndicator, notificationTime } from '../notifications.js';
import { Tabs } from './Tabs.jsx';
import { useModalBehavior } from './modal-behavior.js';
import './popover.css';
import './notification-center.css';

const GLYPHS = {
  bell: 'bell',
  empty: 'bellOff',
  gift: 'gift',
  'billing-error': 'circleAlert',
  payment: 'creditCard',
  balance: 'wallet',
};
function Glyph({ name, size = 18 }) {
  return <Icon name={GLYPHS[name] || name} size={size}/>;
}

function MobilePanel({ children, onClose }) {
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose);
  return createPortal(<div className="notification-backdrop" data-closing={closing || undefined} onPointerDown={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <section ref={dialogRef} className="notification-sheet" role="dialog" aria-modal="true" aria-label="Центр уведомлений" tabIndex={-1} data-closing={closing || undefined}>
      <span className="notification-sheet-handle" aria-hidden="true" />
      {children(requestClose)}
    </section>
  </div>, document.body);
}

function DesktopPanel({ anchorRef, children, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(424, window.innerWidth - 24);
      setPosition({ width, right: Math.max(12, window.innerWidth - anchor.right), top: anchor.bottom + 8, maxHeight: window.innerHeight - anchor.bottom - 20 });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchorRef]);
  useEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });
    const outside = event => { if (!panel?.contains(event.target) && !anchor?.contains(event.target)) closeRef.current(); };
    const keyboard = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      closeRef.current();
      anchor?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    panel?.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('pointerdown', outside);
      panel?.removeEventListener('keydown', keyboard);
      if (document.activeElement === document.body || panel?.contains(document.activeElement)) anchor?.focus({ preventScroll: true });
    };
  }, [anchorRef]);
  return createPortal(<section ref={panelRef} className="ds-popover notification-popover" role="dialog" aria-label="Центр уведомлений" tabIndex={-1} style={position || { visibility: 'hidden' }} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !anchorRef.current?.contains(event.relatedTarget)) onClose();
  }}>{children}</section>, document.body);
}

function NotificationList({ notifications, tab, onMarkRead, onSelect, onBilling }) {
  const [highlighted, setHighlighted] = useState(() => new Map(notifications.filter(item => !item.read).map(item => [item.id, Date.now() + 800])));
  const handled = useRef(new Set());
  const markRead = useRef(onMarkRead);
  markRead.current = onMarkRead;
  useEffect(() => {
    const unread = notifications.filter(item => !item.read && !handled.current.has(item.id));
    if (!unread.length) return;
    const ids = unread.map(item => item.id);
    ids.forEach(id => handled.current.add(id));
    setHighlighted(previous => new Map([...previous, ...ids.map(id => [id, previous.get(id) || Date.now() + 800])]));
    markRead.current?.(ids);
  }, [notifications]);
  useEffect(() => {
    if (!highlighted.size) return;
    const nextExpiry = Math.min(...highlighted.values());
    const timer = window.setTimeout(() => setHighlighted(previous => new Map([...previous].filter(([, expiry]) => expiry > Date.now()))), Math.max(0, nextExpiry - Date.now()));
    return () => window.clearTimeout(timer);
  }, [highlighted]);

  if (!notifications.length) return <div className="notification-empty" role="status">
    <Glyph name={tab === 'offers' ? 'gift' : 'empty'} size={32} />
    <strong>{tab === 'offers' ? 'Скоро что-нибудь интересное' : 'Пока тихо'}</strong>
    <p>{tab === 'offers' ? 'Новые акции и предложения появятся здесь' : 'Новые уведомления появятся здесь'}</p>
  </div>;

  return <div className="notification-list">
    {notifications.map(item => {
      const isResult = Boolean(item.chatId || (item.kind === 'studio' && item.route));
      const actionable = Boolean(isResult || ['billing-error', 'balance', 'offer'].includes(item.type));
      const actionLabel = item.actionLabel || (isResult ? 'Открыть результат' : item.type === 'billing-error' ? 'Обновить карту' : item.type === 'offer' ? 'Посмотреть предложение' : 'Пополнить баланс');
      const Card = actionable ? 'button' : 'article';
      return <Card key={item.id} type={actionable ? 'button' : undefined} className={`notification-card${actionable ? ' is-actionable' : ''}${highlighted.has(item.id) || !item.read ? ' is-unread' : ''}${item.type === 'billing-error' && !item.resolved ? ' is-billing-error' : ''}`} aria-label={actionable ? `${item.title}. ${actionLabel}` : undefined} onClick={actionable ? () => isResult ? onSelect?.(item) : onBilling?.(item) : undefined}>
      <span className="notification-preview">
        {item.thumbnail ? <img className="notification-thumbnail" src={item.thumbnail} alt="" /> : item.type === 'generation' ? <ModeIcon mode={item.mode || 'auto'} size={22} /> : <Glyph name={GLYPHS[item.type] ? item.type : 'gift'} />}
      </span>
      <span className="notification-copy">
        <span className="notification-title"><strong>{item.title}</strong><span aria-hidden="true">·</span><time>{notificationTime(item.createdAt)}</time></span>
        {item.description && <span className="notification-description">{item.description}</span>}
        {actionable && item.type !== 'generation' && <span className="notification-action" aria-hidden="true">{actionLabel}</span>}
      </span>
    </Card>;
    })}
  </div>;
}

/** Controlled read state: onMarkRead receives ids immediately; onSelect receives the full record. */
export function NotificationCenter({ notifications = [], onMarkRead, onSelect, onBilling }) {
  const id = useId();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('notifications');
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => { query.removeEventListener('change', update); window.clearInterval(timer); };
  }, []);
  const indicator = getNotificationIndicator(notifications, now);
  const hasOfferIndicator = getNotificationIndicator(notifications.filter(item => item.type === 'offer'), now) === 'gift';
  const unread = notifications.filter(item => !item.read && item.type !== 'offer').length;
  const visible = notifications.filter(item => tab === 'offers' ? item.type === 'offer' : item.type !== 'offer').sort((a, b) => {
    const errorDifference = Number(b.type === 'billing-error' && !b.resolved) - Number(a.type === 'billing-error' && !a.resolved);
    return errorDifference || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const select = item => { setOpen(false); onSelect?.(item); };
  const billing = item => { setOpen(false); onBilling?.(item); };
  const panel = requestClose => <>
    <header className="notification-header"><Tabs id={id} label="Раздел уведомлений" value={tab} onChange={setTab} items={[
      { id: 'notifications', label: 'Уведомления', controls: `${id}-content` },
      { id: 'offers', label: 'Акции', controls: `${id}-content`, icon: hasOfferIndicator ? <Glyph name="gift" size={14} /> : undefined },
    ]} />{requestClose && <button type="button" className="notification-close icon-button" aria-label="Закрыть уведомления" onClick={requestClose}><Icon name="close" /></button>}</header>
    <div id={`${id}-content`} className="notification-content" role="tabpanel" aria-labelledby={`${id}-tab-${tab}`}><NotificationList key={tab} notifications={visible} tab={tab} onMarkRead={onMarkRead} onSelect={select} onBilling={billing} /></div>
  </>;
  return <>
    <button ref={triggerRef} type="button" className="notification-trigger" aria-label={`Центр уведомлений${unread ? `, непрочитанных: ${unread}` : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <Glyph name="bell" />
      <span className={`notification-indicator notification-indicator-unread${indicator === 'unread' ? ' is-visible' : ''}`} aria-hidden="true" />
      <span className={`notification-indicator notification-indicator-danger${indicator === 'danger' ? ' is-visible' : ''}`} aria-hidden="true" />
      <span className={`notification-indicator notification-indicator-gift${indicator === 'gift' ? ' is-visible' : ''}`} aria-hidden="true"><Glyph name="gift" size={14} /></span>
    </button>
    {open && (mobile ? <MobilePanel onClose={() => setOpen(false)}>{panel}</MobilePanel> : <DesktopPanel anchorRef={triggerRef} onClose={() => setOpen(false)}>{panel()}</DesktopPanel>)}
  </>;
}
