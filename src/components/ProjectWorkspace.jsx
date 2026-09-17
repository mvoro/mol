import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DotsThree, PencilSimple, GearSix, ShareNetwork, Trash, Plus, X, LinkSimple, PushPin } from '@phosphor-icons/react';
import { ProjectIcon, PROJECT_COLORS, getProjectNameError } from './Projects.jsx';
import { Popover, MenuItem } from './Popover.jsx';
import { TextInput } from './TextInput.jsx';
import { Select } from './Select.jsx';
import { ChatActions } from './ChatActions.jsx';
import { ShareLinkActions } from './ShareLink.jsx';
import { ProjectColorPicker } from './ProjectColorPicker.jsx';
import { useModalBehavior } from './modal-behavior.js';
import './project-workspace.css';

export function ProjectActions({ project, onAction }) {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const choose = action => { setOpen(false); onAction(action, project); };
  return <>
    <button ref={anchor} type="button" className="project-action-button" aria-label={`Действия с проектом «${project.name}»`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><DotsThree size={20} weight="regular"/></button>
    {open && <Popover anchorRef={anchor} label={`Действия с проектом «${project.name}»`} onClose={() => setOpen(false)}>
      <MenuItem icon={<PencilSimple size={18}/>} onClick={() => choose('rename')}>Переименовать</MenuItem>
      <MenuItem icon={<GearSix size={18}/>} onClick={() => choose('settings')}>Настройки проекта</MenuItem>
      <MenuItem icon={<ShareNetwork size={18}/>} onClick={() => choose('share')}>Поделиться</MenuItem>
      <div className="ds-menu-separator" role="separator"/>
      <MenuItem icon={<Trash size={18}/>} danger onClick={() => choose('delete')}>Удалить проект</MenuItem>
    </Popover>}
  </>;
}

export function ProjectRow({ project, index, active, expanded, onOpen, onNewChat, onAction, children }) {
  return <div className="sidebar-project-group">
    <div className={`project-sidebar-row${active ? ' is-active' : ''}`}>
      <button className="sidebar-project-row" aria-label={`Проект: ${project.name}`} aria-expanded={expanded} onClick={() => onOpen(project.id)}><ProjectIcon index={index} color={project.color} size={18}/><span>{project.name}</span></button>
      <div className="project-row-actions">
        <button type="button" className="project-action-button" aria-label={`Новый чат в проекте «${project.name}»`} onClick={() => onNewChat(project.id)}><Plus size={16}/></button>
        <ProjectActions project={project} onAction={onAction}/>
      </div>
    </div>
    <div className={'sidebar-project-disclosure' + (expanded ? ' is-open' : '')} inert={!expanded} aria-hidden={!expanded}><div><div className="sidebar-project-chats">{children}</div></div></div>
  </div>;
}

function ProjectConversation({ chat, onOpen, onAction }) {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  return <div className="project-conversation" data-menu-open={open || undefined}>
    <button className="project-conversation-main" title={chat.title} onClick={() => onOpen(chat)}><span><strong>{chat.pinned && <PushPin className="project-chat-pin" size={13} weight="fill" aria-label="Закреплён"/>}{chat.title}</strong><span>{chat.messages?.filter(message => message.text).at(-1)?.text || 'Начните разговор'}</span></span><time>{chat.updatedAt ? new Intl.DateTimeFormat('ru', {day:'numeric',month:'short'}).format(chat.updatedAt) : ''}</time></button>
    <button ref={anchor} type="button" className="project-action-button project-conversation-more" aria-label={`Действия с чатом «${chat.title}»`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><DotsThree size={20} weight="regular"/></button>
    {open && <Popover anchorRef={anchor} label={`Действия с чатом «${chat.title}»`} onClose={() => setOpen(false)}><ChatActions chat={chat} onAction={action => {setOpen(false); onAction(action, chat);}}/></Popover>}
  </div>;
}

export function ProjectWorkspace({ project, index, chats, children, onOpenChat, onAction, onChatAction }) {
  const [archived, setArchived] = useState(false);
  const visible = chats.filter(chat => Boolean(chat.archived) === archived).sort((a,b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const archiveCount = chats.filter(chat => chat.archived).length;
  const hasChats = chats.length > 0;
  return <div className={`project-workspace-scroll${hasChats ? '' : ' is-empty'}`}><section className="project-workspace" aria-label={`Рабочая область проекта ${project.name}`}>
    <header className="project-workspace-heading"><h1><ProjectIcon index={index} color={project.color} size={30}/><span title={project.name}>{project.name}</span></h1><div className="project-workspace-actions"><button type="button" className="pill project-workspace-share" aria-label="Поделиться проектом" onClick={() => onAction('share', project)}><ShareNetwork size={16}/><span>Поделиться</span></button><ProjectActions project={project} onAction={onAction}/></div></header>
    {children}
    {hasChats && <section className="project-conversations" aria-label="Чаты проекта"><div className="project-conversations-title"><h2>{archived ? 'Архив проекта' : 'Чаты проекта'}</h2><span>{visible.length}</span>{(archiveCount > 0 || archived) && <button className="pill project-archive-toggle" onClick={() => setArchived(value => !value)}>{archived ? 'К чатам' : `Архив · ${archiveCount}`}</button>}</div>
      {visible.map(chat => <ProjectConversation key={chat.id} chat={chat} onOpen={onOpenChat} onAction={onChatAction}/>)}
    </section>}
  </section></div>;
}

export function ProjectActionDialog({ action, project, index, existingNames, onClose, onSave, onDelete, onAction }) {
  const id = useId();
  const input = useRef(null);
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color || PROJECT_COLORS[index % PROJECT_COLORS.length]);
  const [instructions, setInstructions] = useState(project.instructions || '');
  const [memory, setMemory] = useState(project.memory || 'default');
  const [libraryAccess, setLibraryAccess] = useState(project.libraryAccess !== false);
  const {dialogRef, closing, requestClose} = useModalBehavior(onClose, ['rename','settings'].includes(action) ? input : undefined);
  const error = getProjectNameError(name, existingNames);
  const title = action === 'rename' ? 'Название проекта' : action === 'delete' ? 'Удалить проект?' : action === 'share' ? 'Поделиться проектом' : 'Настройки проекта';
  const shareUrl = new URL(`/?project=${encodeURIComponent(project.id)}`, window.location.origin).href;
  return createPortal(<div className="mc-project-dialog-overlay" data-closing={closing || undefined} onPointerDown={event => { if(event.target === event.currentTarget) requestClose(); }}>
    <section ref={dialogRef} className="mc-project-dialog project-settings-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} data-closing={closing || undefined}>
      <header><h2 id={`${id}-title`}>{title}</h2><button className="mc-project-close" aria-label="Закрыть окно проекта" onClick={requestClose}><X size={18}/></button></header>
      {action === 'delete' ? <><p>Удалить проект «{project.name}»? Его чаты сохранятся в общей истории без проекта.</p><footer><button className="pill" onClick={requestClose}>Отмена</button><button className="pill project-danger-solid" onClick={() => { onDelete(project.id); requestClose(); }}>Удалить проект</button></footer></> : action === 'share' ? <>
        <p>Ссылка на проект «{project.name}»</p><div className="project-share-link"><LinkSimple size={18}/><TextInput aria-label="Ссылка на проект" value={shareUrl} readOnly onFocus={event => event.target.select()}/></div>
        <p className="project-setting-help">Ссылка открывает сохранённый проект в этом браузере. Совместный доступ пока недоступен.</p>
        <ShareLinkActions url={shareUrl} title={`Проект «${project.name}»`}/>
      </> : <form onSubmit={event => { event.preventDefault(); if(error || closing) return; onSave(project.id, { name:name.trim(), color, instructions, memory, libraryAccess }); requestClose(); }}>
        <div className="project-setting-field"><label htmlFor={`${id}-name`}>Название проекта</label><div className="project-name-with-icon">{action === 'settings' ? <ProjectColorPicker value={color} onChange={setColor}/> : <ProjectIcon color={color} size={19}/>}<TextInput ref={input} id={`${id}-name`} value={name} onChange={event => setName(event.target.value)} maxLength={60} autoComplete="off" required/></div></div>
        {name.trim() && error && <p className="mc-project-error" role="alert">{error}</p>}
        {action === 'settings' && <>
          <label className="project-setting-field" htmlFor={`${id}-instructions`}><span>Инструкции</span><small>Задайте контекст и настройте ответы Молли в этом проекте.</small><textarea id={`${id}-instructions`} value={instructions} onChange={event => setInstructions(event.target.value)} maxLength={5000} placeholder="Например: отвечай кратко, на русском языке. Используй дружелюбный тон." rows={4}/></label>
          <div className="project-setting-field"><label id={`${id}-memory-label`} htmlFor={`${id}-memory`}>Память</label><Select id={`${id}-memory`} aria-labelledby={`${id}-memory-label`} aria-describedby={`${id}-memory-help`} value={memory} onChange={setMemory} options={[{value:'default',label:'Память по умолчанию'},{value:'project',label:'Только этот проект'}]}/><small id={`${id}-memory-help`}>{memory === 'project' ? 'Контекст ограничен чатами этого проекта.' : 'Можно использовать контекст из других чатов.'}</small></div>
          <div className="project-setting-field"><label id={`${id}-library-label`} htmlFor={`${id}-library`}>Доступ к библиотеке</label><Select id={`${id}-library`} aria-labelledby={`${id}-library-label`} value={libraryAccess ? 'yes':'no'} onChange={value => setLibraryAccess(value === 'yes')} options={[{value:'yes',label:'Включено'},{value:'no',label:'Выключено'}]}/></div>
        </>}
        <footer>{action === 'settings' && <button type="button" className="pill project-danger" onClick={() => onAction('delete', project)}><Trash size={15}/>Удалить</button>}<button type="button" className="pill" onClick={requestClose}>Отмена</button><button type="submit" className="pill mc-project-create" disabled={Boolean(error) || closing}>Сохранить</button></footer>
      </form>}
    </section>
  </div>, document.body);
}
