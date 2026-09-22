import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { withBasePath } from '../base-path.js';
import { Icon } from '../ui.jsx';
import { ProjectIcon } from './Projects.jsx';
import { TextInput } from './TextInput.jsx';
import { ShareLinkActions } from './ShareLink.jsx';
import { useModalBehavior } from './modal-behavior.js';
import './account-panel.css';
import './history-dialog.css';

export function HistoryDialog({ action, chat, projects, onClose, onSave }) {
  const id = useId();
  const inputRef = useRef(null);
  const [name, setName] = useState(chat.title);
  const [projectId, setProjectId] = useState(chat.projectId ?? null);
  const { dialogRef, requestClose, closing } = useModalBehavior(onClose, action === 'rename' ? inputRef : undefined);
  const rename = action === 'rename';
  const sharing = action === 'share';
  const shareUrl = new URL(withBasePath(`/?chat=${encodeURIComponent(chat.id)}`), window.location.origin).href;
  const valid = rename ? name.trim().length > 0 : true;
  return createPortal(<div className="account-panel-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <section ref={dialogRef} className="account-panel" data-closing={closing || undefined} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}>
      <header className="account-panel-header"><h2 id={`${id}-title`}>{sharing ? 'Поделиться чатом' : rename ? 'Название чата' : 'Переместить чат'}</h2><button type="button" className="pill round account-panel-close" aria-label="Закрыть окно" onClick={requestClose}><Icon name="close" size={16}/></button></header>
      {sharing ? <div className="account-panel-body"><p>Ссылка на чат «{chat.title}»</p><TextInput aria-label="Ссылка на чат" value={shareUrl} readOnly onFocus={event => event.target.select()}/><p className="project-setting-help">Ссылка открывает сохранённый чат в этом браузере. Совместный доступ пока недоступен.</p><ShareLinkActions url={shareUrl} title={chat.title}/></div> : <form className="account-panel-body" onSubmit={event => { event.preventDefault(); if (!valid || closing) return; onSave(rename ? name.trim() : projectId); requestClose(); }}>
        {rename ? <label className="account-panel-field" htmlFor={`${id}-name`}><span>Название</span><TextInput ref={inputRef} id={`${id}-name`} value={name} onChange={event => setName(event.target.value)} maxLength={100} required autoComplete="off" onFocus={event => event.target.select()}/></label> : <div className="history-destination-list" role="radiogroup" aria-label="Проект для чата">{[{id:null,name:'Без проекта'}, ...projects].map((project,index) => <button key={project.id || 'none'} type="button" role="radio" aria-checked={project.id === projectId} className="history-destination" onClick={() => setProjectId(project.id)}><ProjectIcon index={index - 1} color={project.color} kind={project.id ? 'project' : 'unassigned'} size={18}/><span>{project.name}</span>{project.id === projectId && <Icon name="check" size={16}/>}</button>)}</div>}
        <footer className="account-panel-actions"><button type="button" className="pill account-panel-button" onClick={requestClose}>Отмена</button><button type="submit" className="pill account-panel-button account-panel-primary" disabled={!valid || closing}>{rename ? 'Сохранить' : 'Переместить'}</button></footer>
      </form>}
    </section>
  </div>, document.body);
}
