import React, { useRef, useState } from 'react';
import { UserCircle, ChatsCircle, CreditCard, SlidersHorizontal, Question, SignOut, SignIn } from '@phosphor-icons/react';
import { Icon } from '../ui.jsx';
import { Popover, MenuItem } from './Popover.jsx';

export function ProfileMenu({ account, onSection, onSignOut, onAuth }) {
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const select = section => { setOpen(false); onSection(section); };
  return <><button ref={trigger} className="profile" aria-label="Меню профиля" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><span className="profile-avatar"><Icon name="profile" size={16}/></span><span><b>{account?.name || 'Гость'}</b><small>{account ? 'Бесплатный' : 'Войти в Молекулу'}</small></span></button>{open && <Popover anchorRef={trigger} label="Меню профиля" onClose={() => setOpen(false)}>
    <MenuItem icon={<UserCircle size={20}/>} onClick={() => select('profile')}>Профиль</MenuItem>
    <MenuItem icon={<ChatsCircle size={20}/>} onClick={() => select('community')}>Сообщество</MenuItem>
    <MenuItem icon={<CreditCard size={20}/>} trailing={<span className="profile-pro">ϟ PRO</span>} onClick={() => select('subscription')}>Подписка</MenuItem>
    <MenuItem icon={<SlidersHorizontal size={20}/>} onClick={() => select('settings')}>Настройки</MenuItem>
    <div className="ds-menu-separator" role="separator"/>
    <MenuItem icon={<Question size={20}/>} onClick={() => select('help')}>Помощь</MenuItem>
    <MenuItem icon={account ? <SignOut size={20}/> : <SignIn size={20}/>} onClick={() => { setOpen(false); account ? onSignOut() : onAuth(); }}>{account ? 'Выйти' : 'Войти'}</MenuItem>
  </Popover>}</>;
}
