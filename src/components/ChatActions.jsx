import React from 'react';
import { Share2, Pencil, Pin, Archive, Trash2, Folder, FolderMinus } from 'lucide-react';
import { MenuItem } from './Popover.jsx';

export function ChatActions({ chat, onAction }) {
  return <>
    <MenuItem icon={<Share2 size={18} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => onAction('share')}>Поделиться</MenuItem>
    <MenuItem icon={<Pencil size={18} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => onAction('rename')}>Переименовать</MenuItem>
    <div className="ds-menu-separator" role="separator"/>
    <MenuItem icon={<Pin size={18} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => onAction('pin')}>{chat.pinned ? 'Открепить чат' : 'Закрепить чат'}</MenuItem>
    <MenuItem icon={<Archive size={18} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => onAction('archive')}>{chat.archived ? 'Вернуть из архива' : 'Архивировать'}</MenuItem>
    <MenuItem icon={<Trash2 size={18} strokeWidth={1.75} aria-hidden="true"/>} danger onClick={() => onAction('delete')}>Удалить чат</MenuItem>
    <div className="ds-menu-separator" role="separator"/>
    <MenuItem icon={<Folder size={18} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => onAction('move')}>Переместить в проект</MenuItem>
    {chat.projectId && <MenuItem icon={<FolderMinus size={18} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => onAction('unassign')}>Удалить из проекта</MenuItem>}
  </>;
}
