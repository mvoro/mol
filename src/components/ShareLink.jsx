import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Mail, Send } from 'lucide-react';
import './share-link.css';

export function CopyLinkButton({ value }) {
  const [state, setState] = useState('idle');
  const [keyboard, setKeyboard] = useState(false);
  const reset = useRef(null);
  useEffect(() => () => clearTimeout(reset.current), []);
  const copy = async event => {
    setKeyboard(event.detail === 0);
    clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      reset.current = setTimeout(() => setState('idle'), 2400);
    } catch { setState('error'); }
  };
  return <button type="button" className="pill copy-link-button" data-state={state} data-instant={keyboard || undefined} onClick={copy} aria-label={state === 'copied' ? 'Ссылка скопирована' : state === 'error' ? 'Не удалось скопировать. Повторить' : 'Скопировать ссылку'}>
    <span className="copy-link-layer copy-link-idle" aria-hidden="true"><Copy size={16} strokeWidth={1.75} aria-hidden="true"/><span>{state === 'error' ? 'Повторить' : 'Скопировать ссылку'}</span></span>
    <span className="copy-link-layer copy-link-done" aria-hidden="true"><Check size={16} strokeWidth={1.75} aria-hidden="true"/><span>Скопировано</span></span>
    <span className="visually-hidden" role="status">{state === 'copied' ? 'Ссылка скопирована' : state === 'error' ? 'Не удалось скопировать. Ссылку можно выделить вручную или повторить попытку.' : ''}</span>
  </button>;
}

export function ShareLinkActions({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return <div className="share-link-actions">
    <div className="share-link-targets" aria-label="Поделиться ссылкой">
      <a href={`mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${title}\n${url}`)}`} aria-label="Отправить по почте" title="Почта"><Mail size={20} strokeWidth={1.75} aria-hidden="true"/></a>
      <a href={`https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer" aria-label="Поделиться во ВКонтакте" title="ВКонтакте"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3 6h3c.2 4.2 2 6 3.4 6.4V6h2.8v3.7c1.4-.2 3-2 3.5-3.7h2.9c-.4 2.2-2.2 4-3.4 4.8 1.2.6 3.4 2.3 4.1 5.2h-3.2c-.6-1.9-2-3.4-3.9-3.6V16h-.4C5.9 16 3.3 12 3 6Z"/></svg></a>
      <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" aria-label="Поделиться в Telegram" title="Telegram"><Send size={20} strokeWidth={1.75} aria-hidden="true"/></a>
    </div>
    <CopyLinkButton value={url}/>
  </div>;
}
