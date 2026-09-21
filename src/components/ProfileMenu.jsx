import React, { useRef, useState } from 'react';
import { CircleUserRound, MessagesSquare, CreditCard, SlidersHorizontal, CircleHelp, LogOut, LogIn } from 'lucide-react';
import { Icon } from '../ui.jsx';
import { Popover, MenuItem } from './Popover.jsx';

export function ProfileMenu({ account, onSection, onSignOut, onAuth }) {
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const select = section => { setOpen(false); onSection(section); };
  return <><button ref={trigger} className="profile" aria-label="Меню профиля" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><span className="profile-avatar"><Icon name="profile" size={16}/></span><span><b>{account?.name || 'Гость'}</b><small>{account ? 'Бесплатный' : 'Войти в Молекулу'}</small></span></button>{open && <Popover anchorRef={trigger} label="Меню профиля" onClose={() => setOpen(false)}>
    <MenuItem icon={<CircleUserRound size={20} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => select('profile')}>Профиль</MenuItem>
    <MenuItem icon={<MessagesSquare size={20} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => select('community')}>Сообщество</MenuItem>
    <MenuItem icon={<CreditCard size={20} strokeWidth={1.75} aria-hidden="true"/>} trailing={<span className="profile-pro">ϟ PRO</span>} onClick={() => select('subscription')}>Подписка</MenuItem>
    <MenuItem icon={<SlidersHorizontal size={20} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => select('settings')}>Настройки</MenuItem>
    <div className="ds-menu-separator" role="separator"/>
    <MenuItem icon={<CircleHelp size={20} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => select('help')}>Помощь</MenuItem>
    <MenuItem icon={account ? <LogOut size={20} strokeWidth={1.75} aria-hidden="true"/> : <LogIn size={20} strokeWidth={1.75} aria-hidden="true"/>} onClick={() => { setOpen(false); account ? onSignOut() : onAuth(); }}>{account ? 'Выйти' : 'Войти'}</MenuItem>
  </Popover>}</>;
}
