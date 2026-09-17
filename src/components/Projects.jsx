import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, Check, FolderSimple, FolderSimpleMinus, Folders, Plus, X } from '../outline-icons.jsx'
import { useModalBehavior } from './modal-behavior.js'
import { TextInput } from './TextInput.jsx'
import './projects.css'

import { PROJECT_COLORS } from '../project-history.js'
export { PROJECT_COLORS } from '../project-history.js'
const focusableSelector = 'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]'
const isVisible = element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'
const hasOtherModal = element => [...document.querySelectorAll('[aria-modal="true"]')].some(modal => modal !== element && !element?.contains(modal) && isVisible(modal))

export function ProjectIcon({ index, color, kind = 'project', size = 17 }) {
  const colorIndex = kind === 'project' && Number.isInteger(index) && index >= 0 ? index % PROJECT_COLORS.length : undefined
  const Glyph = kind === 'unassigned' ? FolderSimpleMinus : kind === 'all' ? Folders : FolderSimple
  return <Glyph className="mc-project-icon" data-folder-color={colorIndex} data-kind={kind}
    size={size} weight={color || colorIndex !== undefined ? 'fill' : 'regular'}
    style={{ width: size, height: size, color: color || (colorIndex === undefined ? undefined : PROJECT_COLORS[colorIndex]) }}
    aria-hidden="true" focusable="false" />
}

function useProjectMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return mobile
}

function useProjectMenuKeyboard(menuRef, onClose, triggerRef) {
  const typeahead = useRef('')
  const typeaheadTimer = useRef(null)
  useEffect(() => () => clearTimeout(typeaheadTimer.current), [])
  return event => {
    const items = [...menuRef.current.querySelectorAll('[role^="menuitem"]')]
    const current = items.indexOf(document.activeElement)
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : current < 0 ? (event.key === 'ArrowUp' ? items.length - 1 : 0) : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items[next]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    } else if (event.key === 'Tab' && triggerRef) {
      event.preventDefault()
      const external = [...document.querySelectorAll(focusableSelector)].filter(element => !menuRef.current.contains(element) && isVisible(element))
      const triggerIndex = external.indexOf(triggerRef.current)
      const next = external[triggerIndex + (event.shiftKey ? -1 : 1)]
      onClose()
      if (next) next.focus({ preventScroll: true })
      else triggerRef.current?.focus({ preventScroll: true })
    } else if (event.key.length === 1 && event.key !== ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      typeahead.current += event.key.toLocaleLowerCase('ru')
      clearTimeout(typeaheadTimer.current)
      typeaheadTimer.current = setTimeout(() => { typeahead.current = '' }, 600)
      const ordered = [...items.slice(current + 1), ...items.slice(0, current + 1)]
      ordered.find(item => item.dataset.label.toLocaleLowerCase('ru').startsWith(typeahead.current))?.focus()
    }
  }
}

function ProjectOptions({ projects, value, onChoose, onNew, onWithoutProject }) {
  return <>
    {onWithoutProject && <button type="button" role="menuitemradio" aria-checked={value === null} data-label="Без проекта" className="mc-project-option" onClick={() => onChoose(onWithoutProject)}>
      <ProjectIcon kind="unassigned" /><span>Без проекта</span>{value === null && <Check className="mc-project-check" size={15} aria-hidden="true" />}
    </button>}
    {projects.map((project, index) => <button key={project.id} type="button" role="menuitemradio" aria-checked={project.id === value} data-label={project.name} className="mc-project-option" onClick={() => onChoose(() => onNew.change(project.id))}>
      <ProjectIcon index={index} color={project.color} /><span title={project.name}>{project.name}</span>{project.id === value && <Check className="mc-project-check" size={15} aria-hidden="true" />}
    </button>)}
    <button type="button" role="menuitem" data-label="Новый проект" className="mc-project-option" onClick={() => onChoose(onNew.create)}><Plus size={17} aria-hidden="true" /><span>Новый проект</span></button>
  </>
}

function DesktopProjectMenu({ id, triggerRef, initialEdge, onClose, onChoose, ...options }) {
  const menuRef = useRef(null)
  const closeTimer = useRef(null)
  const closingRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const [closing, setClosing] = useState(false)
  onCloseRef.current = onClose
  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    const immediate = document.body.dataset.input === 'keyboard' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (immediate) { onCloseRef.current(); return }
    setClosing(true)
    closeTimer.current = setTimeout(() => onCloseRef.current(), 120)
  }, [])
  const keyDown = useProjectMenuKeyboard(menuRef, requestClose, triggerRef)

  useLayoutEffect(() => {
    const menu = menuRef.current
    const trigger = triggerRef.current
    if (!menu || !trigger) return
    const place = () => {
      const rect = trigger.getBoundingClientRect()
      const width = menu.offsetWidth
      const viewportWidth = document.documentElement.clientWidth
      const viewportHeight = window.innerHeight
      const below = viewportHeight - rect.bottom - 8 - 12
      const above = rect.top - 8 - 12
      const opensAbove = below < Math.min(menu.scrollHeight, 180) && above > below
      const available = Math.max(80, opensAbove ? above : below)
      menu.style.maxHeight = `${available}px`
      menu.style.left = `${Math.max(12, Math.min(rect.left, viewportWidth - width - 12))}px`
      menu.style.top = `${Math.max(12, opensAbove ? rect.top - 8 - menu.offsetHeight : rect.bottom + 8)}px`
      menu.style.transformOrigin = `${Math.min(width - 8, Math.max(8, rect.left - parseFloat(menu.style.left) + 16))}px ${opensAbove ? 'bottom' : 'top'}`
      menu.dataset.placement = opensAbove ? 'top' : 'bottom'
    }
    let frame = 0
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(place) }
    place()
    const observer = new ResizeObserver(schedule)
    observer.observe(trigger)
    observer.observe(menu)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [triggerRef])

  useEffect(() => {
    const menu = menuRef.current
    const trigger = triggerRef.current
    const items = [...menu.querySelectorAll('[role^="menuitem"]')]
    const selected = menu.querySelector('[aria-checked="true"]')
    ;(selected || (initialEdge === 'last' ? items.at(-1) : items[0]))?.focus({ preventScroll: true })
    const outside = event => {
      if (!menu.contains(event.target) && !trigger?.contains(event.target)) requestClose()
    }
    document.addEventListener('pointerdown', outside)
    return () => {
      clearTimeout(closeTimer.current)
      document.removeEventListener('pointerdown', outside)
      const active = document.activeElement
      if ((!active || active === document.body || menu.contains(active)) && !hasOtherModal(menu) && trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [triggerRef, initialEdge, requestClose])

  return createPortal(<div id={id} ref={menuRef} className="mc-project-menu" role="menu" aria-label="Проект" data-closing={closing || undefined} onKeyDown={keyDown}>
    <ProjectOptions {...options} onChoose={action => { if (closingRef.current) return; onChoose(action); requestClose() }} />
  </div>, document.body)
}

function MobileProjectMenu({ id, onClose, onChoose, ...options }) {
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose)
  const menuRef = useRef(null)
  const keyDown = useProjectMenuKeyboard(menuRef, requestClose)
  const choosing = useRef(false)
  return createPortal(<div className="mc-project-sheet-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.target === event.currentTarget) requestClose() }}>
    <section className="mc-project-sheet" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Выберите проект" tabIndex={-1} data-closing={closing || undefined} onKeyDown={keyDown}>
      <div className="mc-project-sheet-grabber" />
      <header><span>Выберите проект</span><button type="button" className="mc-project-close" aria-label="Закрыть выбор проекта" onClick={requestClose}><X size={18} /></button></header>
      <div id={id} ref={menuRef} className="mc-project-sheet-options" role="menu" aria-label="Проект">
        <ProjectOptions {...options} onChoose={action => { if (choosing.current || closing) return; choosing.current = true; onChoose(action); requestClose() }} />
      </div>
    </section>
  </div>, document.body)
}

export function ProjectSelect({ projects = [], value, onChange, onNew, onWithoutProject, onOpen }) {
  const id = useId()
  const triggerRef = useRef(null)
  const pendingAction = useRef(null)
  const [open, setOpen] = useState(false)
  const [initialEdge, setInitialEdge] = useState('first')
  const mobile = useProjectMobile()
  const selectedIndex = projects.findIndex(project => project.id === value)
  const name = value === null ? 'Проекты' : projects[selectedIndex]?.name || 'Выберите проект'
  const finishClose = () => {
    setOpen(false)
    const action = pendingAction.current
    pendingAction.current = null
    if (action) {
      // The next dialog captures the stable trigger as its return-focus target.
      if (!hasOtherModal(null)) triggerRef.current?.focus({ preventScroll: true })
      action()
    }
  }
  const openFromKeyboard = event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    setInitialEdge(event.key === 'ArrowUp' ? 'last' : 'first')
    setOpen(true)
  }
  const menuProps = { id, projects, value, onWithoutProject, onClose: finishClose, onChoose: action => { pendingAction.current = action }, onNew: { create: onNew, change: onChange } }
  return <div className="mc-project-trigger-group">
    {value && onOpen && <button type="button" className="pill mc-project-select mc-project-open" aria-label={name} title={name} onClick={() => onOpen(value)}><ProjectIcon index={selectedIndex} color={projects[selectedIndex]?.color}/><span>{name}</span></button>}
    <button ref={triggerRef} type="button" className="pill mc-project-select" aria-label={`Проект: ${name}`} title={name} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onKeyDown={openFromKeyboard} onClick={() => { pendingAction.current = null; setInitialEdge('first'); setOpen(current => !current) }}>
      {!(value && onOpen) && <><ProjectIcon index={selectedIndex} color={projects[selectedIndex]?.color} kind={value === null ? 'all' : 'project'} /><span>{name}</span></>}<CaretDown size={12} aria-hidden="true" />
    </button>
    {open && (mobile ? <MobileProjectMenu {...menuProps} /> : <DesktopProjectMenu {...menuProps} triggerRef={triggerRef} initialEdge={initialEdge} />)}
  </div>
}

export function getProjectNameError(name, existingNames = []) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return 'Введите название проекта'
  if (trimmed.length > 60) return 'Название должно быть не длиннее 60 символов'
  const normalize = value => String(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru')
  if (existingNames.some(existing => normalize(existing) === normalize(trimmed))) return 'Проект с таким названием уже существует'
  return ''
}

export function ProjectDialog({ onClose, onCreate, existingNames = [] }) {
  const id = useId()
  const inputRef = useRef(null)
  const submitted = useRef(false)
  const mounted = useRef(true)
  const [name, setName] = useState('')
  const [serverError, setServerError] = useState('')
  const [pending, setPending] = useState(false)
  const { dialogRef, closing, requestClose } = useModalBehavior(onClose, inputRef)
  const validationError = getProjectNameError(name, existingNames)
  const visibleError = serverError || (!pending && name.trim() ? validationError : '')
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const create = async event => {
    event.preventDefault()
    if (submitted.current || closing || validationError) return
    submitted.current = true
    setPending(true)
    setServerError('')
    try {
      const result = await onCreate(name.trim())
      if (!mounted.current) return
      if (result === false) {
        submitted.current = false
        setPending(false)
        setServerError('Проект с таким названием уже существует')
        inputRef.current?.focus({ preventScroll: true })
        return
      }
      requestClose()
    } catch {
      if (!mounted.current) return
      submitted.current = false
      setPending(false)
      setServerError('Не удалось создать проект. Попробуйте ещё раз.')
    }
  }
  return createPortal(<div className="mc-project-dialog-overlay" data-closing={closing || undefined} onPointerDown={event => { if (event.target === event.currentTarget && !pending) requestClose() }}>
    <section className="mc-project-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} data-closing={closing || undefined}>
      <button type="button" className="mc-project-close mc-project-dialog-close" aria-label="Закрыть создание проекта" onClick={requestClose} disabled={pending}><X size={18} aria-hidden="true" /></button>
      <form className="mc-project-dialog-form" onSubmit={create} noValidate>
        <header><h2 id={`${id}-title`}>Новый проект</h2></header>
        <div className="mc-project-name-field">
          <label htmlFor={`${id}-name`}>Название проекта</label>
          <TextInput ref={inputRef} id={`${id}-name`} value={name} onChange={event => { setName(event.target.value); setServerError('') }} maxLength={60} required placeholder="Например, Летняя кампания" autoComplete="off" disabled={pending}
            aria-invalid={Boolean(visibleError)} aria-describedby={visibleError ? `${id}-error` : undefined} />
          {visibleError && <p className="mc-project-error" id={`${id}-error`} role="alert">{visibleError}</p>}
        </div>
        <footer>
          <button type="button" className="pill mc-project-button mc-project-cancel" onClick={requestClose} disabled={pending}>Отмена</button>
          <button type="submit" className="pill mc-project-button mc-project-create" disabled={Boolean(validationError) || pending || closing} aria-busy={pending}>{pending ? 'Создание…' : 'Создать проект'}</button>
        </footer>
      </form>
    </section>
  </div>, document.body)
}
