import React from 'react';
import { ShareNetwork, PencilSimple, PushPin, Archive, Trash, FolderSimple, FolderMinus } from '@phosphor-icons/react';
import { MenuItem } from './Popover.jsx';

export function ChatActions({ chat, onAction }) {
  return <>
    <MenuItem icon={<ShareNetwork size={18}/>} onClick={() => onAction('share')}>Поделиться</MenuItem>
    <MenuItem icon={<PencilSimple size={18}/>} onClick={() => onAction('rename')}>Переименовать</MenuItem>
    <div className="ds-menu-separator" role="separator"/>
    <MenuItem icon={<PushPin size={18}/>} onClick={() => onAction('pin')}>{chat.pinned ? 'Открепить чат' : 'Закрепить чат'}</MenuItem>
    <MenuItem icon={<Archive size={18}/>} onClick={() => onAction('archive')}>{chat.archived ? 'Вернуть из архива' : 'Архивировать'}</MenuItem>
    <MenuItem icon={<Trash size={18}/>} danger onClick={() => onAction('delete')}>Удалить чат</MenuItem>
    <div className="ds-menu-separator" role="separator"/>
    <MenuItem icon={<FolderSimple size={18}/>} onClick={() => onAction('move')}>Переместить в проект</MenuItem>
    {chat.projectId && <MenuItem icon={<FolderMinus size={18}/>} onClick={() => onAction('unassign')}>Удалить из проекта</MenuItem>}
  </>;
}
