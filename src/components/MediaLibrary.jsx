import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, ModeIcon } from '../ui.jsx';
import { FileChip } from './ChatComposer.jsx';
import { useModalBehavior } from './modal-behavior.js';
import { Tabs } from './Tabs.jsx';
import './media-library.css';

export function MediaLibrary({ items, files, onOpen, onClose }) {
  const [filter, setFilter] = useState('all');
  const pendingAction = useRef(null);
  const { dialogRef, requestClose, closing } = useModalBehavior(() => { onClose(); pendingAction.current?.(); });
  const filtered = items.filter(item => filter === 'all' || item.type === filter);
  return createPortal(<div className="media-library-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <section ref={dialogRef} className="media-library" role="dialog" aria-modal="true" aria-labelledby="media-library-title" tabIndex={-1}>
      <header><div><h2 id="media-library-title">Файлы и медиа</h2><p>Результаты ваших чатов в одном месте</p></div><button className="pill round" aria-label="Закрыть файлы" onClick={requestClose}><Icon name="close" size={16}/></button></header>
      <Tabs className="media-library-filters" label="Фильтр результатов" value={filter} onChange={setFilter} items={[['all','Все'],['image','Изображения'],['video','Видео'],['audio','Аудио']].map(([id,label]) => ({ id, label }))}/>
      {filtered.length > 0 ? <div className="media-library-grid">{filtered.map(item => <button key={item.id} className="library-media" onClick={() => { pendingAction.current = () => onOpen(item); requestClose(); }} aria-label={`Открыть: ${item.title}`}><span className="library-media-cover"><img src={item.poster || item.src} alt="" loading="lazy"/><span><ModeIcon mode={item.type} size={18}/></span>{item.type !== 'image' && <i><Icon name="play" size={18}/></i>}</span><strong>{item.title}</strong><small>{item.model}</small></button>)}</div> : <div className="library-empty"><Icon name="files" size={32}/><h3>Здесь появятся ваши работы</h3><p>Создайте изображение, видео или музыку в чате.</p></div>}
      {files.length > 0 && filter === 'all' && <section className="library-attachments"><h3>Прикреплённые файлы</h3><div>{files.map((file,index) => <FileChip file={file} key={file.id || index}/>)}</div></section>}
    </section>
  </div>, document.body);
}
