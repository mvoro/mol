import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TextInput } from "./TextInput.jsx";
import { Icon } from "../ui.jsx";
import { ROLE_CATALOG, resolveCatalogRole } from "./role-data.js";
import { useRoleFavorites } from "./useRoleFavorites.js";
import {
  getSettingsOptions,
  SETTINGS_DEFAULTS,
  SETTINGS_TITLES,
} from "./settings-data.js";
import "./settings.css";
import { previewVoice } from "../speech-preview.js";

function Glyph({ name, size = 18, filled = false }) {
  const extras = {
    attach: 'attach', chevron: 'chevron', check: 'check', star: 'star',
    play: 'play', music: 'music', volume: 'volume', layers: 'layers',
    imageImport: 'image-import', token: 'token', 'ratio-Авто': 'ratio-auto',
    'ratio-1:1': 'ratio-1-1', 'ratio-3:2': 'ratio-3-2', 'ratio-2:3': 'ratio-2-3',
    'ratio-4:3': 'ratio-4-3', 'ratio-3:4': 'ratio-3-4',
    'ratio-16:9': 'ratio-16-9', 'ratio-9:16': 'ratio-9-16',
  };
  const source = name === 'star' && filled ? '/assets/roles/e551a.svg' : extras[name] && `/figma/settings-${extras[name]}.svg`;
  return source ? <span aria-hidden="true" className="settings-glyph" style={{ width: size, height: size, maskImage: `url(${source})` }}/> : <Icon name={name} size={size}/>;
}

function Boost({ value }) {
  return value ? (
    <span className="settings-boost">
      +{value}
      <Glyph name="token" size={12} />
    </span>
  ) : null;
}

function useMobile() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 700px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

const clamp = (value, min, max) =>
  Math.max(min, Math.min(value, Math.max(min, max)));

export function getSettingsPanelPlacement({
  anchorLeft,
  anchorTop,
  mainWidth,
  mainHeight,
  submenuWidth = 0,
  submenuHeight = 0,
  viewportWidth,
  viewportHeight,
}) {
  const margin = 12;
  const left = clamp(anchorLeft, margin, viewportWidth - margin - mainWidth);
  const top = clamp(
    anchorTop - 8 - mainHeight,
    margin,
    viewportHeight - margin - mainHeight,
  );
  if (!submenuWidth) return { left, top };
  let side = "right";
  let submenuLeft = left + 390;
  if (submenuLeft + submenuWidth > viewportWidth - margin) {
    side = "left";
    submenuLeft = left - 6 - submenuWidth;
    if (submenuLeft < margin) {
      side = "replace";
      submenuLeft = left;
    }
  }
  const submenuTop = clamp(
    side === "replace" ? top : top - 58,
    margin,
    viewportHeight - margin - submenuHeight,
  );
  return { left, top, side, submenuLeft, submenuTop };
}

export function getSettingsMenuPresentation(entryMenu, panel = entryMenu) {
  const direct = entryMenu !== "main";
  return {
    direct,
    canGoBack: !direct && panel !== "main",
    showSubmenu: !direct && panel !== "main",
  };
}

function hasExternalModal(settingsRoot) {
  return [...document.querySelectorAll('[aria-modal="true"]')].some(
    (element) =>
      element !== settingsRoot &&
      !settingsRoot?.contains(element) &&
      element.getClientRects().length > 0,
  );
}

export function SettingsMenu({
  mode = "auto",
  values = {},
  onChange,
  menu,
  onClose,
  onUpload,
  onRoleInfo,
  onMenuChange,
}) {
  const mobile = useMobile();
  const [panel, setPanel] = useState(menu || "main");
  const [entryMenu, setEntryMenu] = useState(menu || "main");
  const [present, setPresent] = useState(Boolean(menu));
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useRoleFavorites();
  const root = useRef(null);
  const stopVoice = useRef(null);
  const [previewingVoice, setPreviewingVoice] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState("");
  useEffect(() => () => stopVoice.current?.(), []);
  useEffect(() => { if (!menu) { stopVoice.current?.(); setPreviewingVoice(null); } }, [menu]);
  const previousFocus = useRef(null);
  const trigger = useRef(null);
  const firstOpen = useRef(false);
  const requestedMenu = useRef(null);
  const settings = { ...SETTINGS_DEFAULTS[mode], ...values };
  const opened = Boolean(menu);
  const { direct, canGoBack, showSubmenu } = getSettingsMenuPresentation(
    entryMenu,
    panel,
  );

  useLayoutEffect(() => {
    if (menu) {
      // A parent may reflect onMenuChange; keep the original trigger's flow.
      if (requestedMenu.current !== menu) setEntryMenu(menu);
      requestedMenu.current = null;
      setPresent(true);
      setPanel(menu);
      setQuery("");
    } else {
      requestedMenu.current = null;
    }
  }, [menu]);

  useEffect(() => {
    if (menu) return;
    const keyboard =
      document.body.dataset.input === "keyboard" ||
      document.documentElement.dataset.input === "keyboard";
    const timeout = setTimeout(
      () => setPresent(false),
      keyboard ? 0 : mobile ? 240 : 120,
    );
    return () => clearTimeout(timeout);
  }, [menu, mobile]);

  const openPanel = (next) => {
    root.current?.focus({ preventScroll: true });
    setPanel(next);
    setQuery("");
    if (onMenuChange) requestedMenu.current = next;
    onMenuChange?.(next);
  };

  useLayoutEffect(() => {
    if (!opened || !present) return;
    const active = document.activeElement;
    if (!firstOpen.current || active?.matches("[data-settings-trigger]")) {
      previousFocus.current = active;
      firstOpen.current = true;
    }
    if (!hasExternalModal(root.current))
      root.current?.focus({ preventScroll: true });
  }, [opened, present, mobile, menu]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!opened || !present || mobile || !element) return;
    const parent = element.offsetParent || element.parentElement;
    const main = element.querySelector(".settings-main");
    const submenu = element.querySelector(".settings-submenu");
    if (!parent || !main) return;
    const selectedTrigger = parent.querySelector(
      '[data-settings-trigger][aria-expanded="true"]',
    );
    if (selectedTrigger) trigger.current = selectedTrigger;
    if (!trigger.current?.isConnected || !parent.contains(trigger.current)) {
      trigger.current = parent.querySelector("[data-settings-trigger]");
    }

    const place = () => {
      const parentRect = parent.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const margin = 12;
      const triggerRect = trigger.current?.getBoundingClientRect();
      const anchorLeft =
        triggerRect?.left ??
        parentRect.left +
          (parseFloat(getComputedStyle(parent).getPropertyValue("--menu-x")) ||
            20);
      const anchorTop = triggerRect?.top ?? parentRect.top;
      main.style.maxHeight = `${Math.max(40, viewportHeight - margin * 2)}px`;
      const mainWidth = main.offsetWidth;
      const mainHeight = main.offsetHeight;
      const { left, top } = getSettingsPanelPlacement({
        anchorLeft,
        anchorTop,
        mainWidth,
        mainHeight,
        viewportWidth,
        viewportHeight,
      });
      // Use the positioned parent, not offsetLeft: chips have their own wrappers.
      element.style.left = `${left - parentRect.left + parent.scrollLeft - parent.clientLeft}px`;
      element.style.bottom = `${parent.clientHeight - (top - parentRect.top + parent.scrollTop - parent.clientTop) - mainHeight}px`;
      main.style.transformOrigin = `${clamp(anchorLeft - left + 16, 0, mainWidth)}px bottom`;
      element.dataset.collision = "none";
      main.removeAttribute("aria-hidden");
      if (!submenu) return;

      // Preserve the Figma 390 / -58 placement whenever both panels fit.
      submenu.style.maxHeight = `${Math.max(80, viewportHeight - margin * 2)}px`;
      submenu.style.width = "";
      let submenuWidth = submenu.offsetWidth;
      const { side, submenuLeft } = getSettingsPanelPlacement({
        anchorLeft,
        anchorTop,
        mainWidth,
        mainHeight,
        submenuWidth,
        submenuHeight: submenu.offsetHeight,
        viewportWidth,
        viewportHeight,
      });
      if (side === "replace") {
        element.dataset.collision = "replace";
        main.setAttribute("aria-hidden", "true");
        submenu.style.width = `${mainWidth}px`;
        submenuWidth = mainWidth;
      }
      const submenuHeight = submenu.offsetHeight;
      const submenuTop = clamp(
        side === "replace" ? top : top - 58,
        margin,
        viewportHeight - margin - submenuHeight,
      );
      submenu.style.left = `${clamp(submenuLeft, margin, viewportWidth - margin - submenuWidth) - left}px`;
      submenu.style.top = `${submenuTop - top}px`;
      submenu.style.transformOrigin =
        side === "left" ? "top right" : "top left";
      submenu.dataset.side = side;
    };
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    const observer = new ResizeObserver(schedule);
    observer.observe(parent);
    observer.observe(main);
    if (submenu) observer.observe(submenu);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      // Inline desktop coordinates must not leak into the mobile portal.
      element.style.left = "";
      element.style.bottom = "";
    };
  }, [opened, present, mobile, menu, panel, direct]);

  useEffect(() => {
    if (present) return;
    const active = document.activeElement;
    const focusUnclaimed =
      !active ||
      active === document.body ||
      active === document.documentElement;
    if (
      firstOpen.current &&
      focusUnclaimed &&
      !hasExternalModal(null) &&
      previousFocus.current?.isConnected
    ) {
      previousFocus.current.focus({ preventScroll: true });
    }
    firstOpen.current = false;
    trigger.current = null;
  }, [present]);

  useEffect(() => {
    if (!opened) return;
    const outside = (event) => {
      if (
        root.current?.contains(event.target) ||
        event.target.closest("[data-settings-trigger]")
      )
        return;
      onClose?.();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [opened, onClose]);

  if (!present) return null;

  const choose = (value) => {
    onChange?.(panel, value);
    onClose?.();
  };
  const toggle = (key) => onChange?.(key, !settings[key]);
  const keyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (canGoBack) openPanel("main");
      else onClose?.();
      return;
    }
    const focusable = [
      ...root.current.querySelectorAll("button:not(:disabled), input"),
    ].filter(
      (element) =>
        element.getClientRects().length &&
        getComputedStyle(element).visibility !== "hidden",
    );
    const current = focusable.indexOf(document.activeElement);
    if (event.key === "Tab" && mobile && focusable.length) {
      if (event.shiftKey && current <= 0) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (
        !event.shiftKey &&
        (current < 0 || current === focusable.length - 1)
      ) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
    if (
      ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) &&
      event.target.tagName !== "INPUT"
    ) {
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? focusable.length - 1
            : (current +
                (event.key === "ArrowDown" ? 1 : -1) +
                focusable.length) %
              focusable.length;
      focusable[next]?.focus();
    }
    if (
      event.key === "ArrowLeft" &&
      canGoBack &&
      event.target.tagName !== "INPUT"
    ) {
      event.preventDefault();
      openPanel("main");
    }
  };

  const row = (key, label, icon, options = {}) => (
    <button
      key={key}
      type="button"
      className={`settings-row${panel === key ? " settings-row-active" : ""}`}
      onClick={() => (options.toggle ? toggle(key) : openPanel(key))}
      role={options.toggle ? "switch" : undefined}
      aria-checked={options.toggle ? Boolean(settings[key]) : undefined}
      aria-expanded={!options.toggle ? panel === key : undefined}
    >
      <Glyph name={icon} />
      <span className="settings-label">{label}</span>
      {options.boost && <Boost value={options.boost} />}
      {options.toggle ? (
        <span
          aria-hidden="true"
          className={`settings-switch${settings[key] ? " is-on" : ""}`}
        >
          <span />
        </span>
      ) : (
        <>
          <span className="settings-value">
            {options.hideValue ? "" : settings[key]}
          </span>
          <Glyph name="chevron" size={12} />
        </>
      )}
    </button>
  );

  const mainContent = (
    <>
      <button
        type="button"
        className="settings-row"
        onClick={() => {
          onUpload?.();
          onClose?.();
        }}
      >
        <Glyph name="attach" />
        <span className="settings-label">
          {["image", "video"].includes(mode)
            ? "Добавить фото или файл"
            : "Прикрепить фото и файлы"}
        </span>
      </button>
      <div className="settings-separator" />
      {mode === "auto" && row("speed", "Скорость ответа", "flash")}
      {["auto", "text"].includes(mode) &&
        row(
          "role",
          `Роль: ${!settings.role || settings.role === "Без роли" ? "не выбрана" : settings.role}`,
          "role",
          { hideValue: true },
        )}
      {["auto", "text"].includes(mode) && (
        <>
          {row("web", "Поиск в сети", "globe", { toggle: true, boost: 15 })}
          {row("reasoning", "Глубокое исследование", "brain", {
            toggle: true,
            boost: 1,
          })}
        </>
      )}
      {["image", "video"].includes(mode) &&
        row("ratio", "Соотношение сторон", "crop")}
      {mode === "video" && row("duration", "Длительность", "timer")}
      {["image", "video"].includes(mode) &&
        row("quality", "Качество", "diamond")}
      {mode === "image" &&
        row("count", "Количество", "copy")}
      {mode === "video" && (
        <>
          {row("sound", "Звук", "volume", { toggle: true, boost: 200 })}
          {row("lastImage", "Последняя картинка", "imageImport", {
            toggle: true,
          })}
          {row("chatImages", "Картинки из чата", "layers", { toggle: true })}
        </>
      )}
      {mode === "audio" && (
        <>
          {row("voice", "Голос", "voice")}
          {row("language", "Язык", "globe")}
          {row("duration", "Длительность", "timer")}
          {row("backgroundMusic", "Фоновая музыка", "music", {
            toggle: true,
            boost: 150,
          })}
        </>
      )}
    </>
  );

  const options = getSettingsOptions(mode, panel);
  const currentValue =
    panel === "voice" && settings.voice === "Женский" ? "Аля" : settings[panel];
  const selectedRole = resolveCatalogRole(settings.role)?.name || settings.role || "Без роли";
  const roleNames = ["Без роли", ...ROLE_CATALOG.map(role => role.name)];
  if (!roleNames.includes(selectedRole)) roleNames.splice(1, 0, selectedRole);
  const roles = roleNames.filter((name) => {
    const role = resolveCatalogRole(name);
    return `${name} ${role?.description || ""}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
  });
  const submenuContent =
    panel === "role" ? (
      <>
        <label className="settings-search">
          <span className="settings-sr-only">Поиск роли</span>
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск роли"
          />
        </label>
        <div className="settings-role-list">
          {roles.length ? (
            roles.map((role) => (
              <div
                className={`settings-role-row${selectedRole === role ? " is-selected" : ""}`}
                key={role}
              >
                <button
                  type="button"
                  className="settings-role-select"
                  aria-pressed={selectedRole === role}
                  onClick={() => choose(role)}
                >
                  <Glyph name="role" />
                  <span>{role}</span>
                </button>
                {role === "Без роли" ? (
                  selectedRole === role && (
                    <span className="settings-role-check">
                      <Glyph name="check" size={16} />
                    </span>
                  )
                ) : (
                  <>
                    {resolveCatalogRole(role) && <button
                      type="button"
                      className={`settings-mini-button settings-favorite${favorites.includes(resolveCatalogRole(role).id) ? " is-favorite" : ""}`}
                      aria-label={`${favorites.includes(resolveCatalogRole(role).id) ? "Убрать из избранного" : "В избранное"}: ${role}`}
                      aria-pressed={favorites.includes(resolveCatalogRole(role).id)}
                      onClick={() =>
                        setFavorites((current) =>
                          current.includes(resolveCatalogRole(role).id)
                            ? current.filter((item) => item !== resolveCatalogRole(role).id)
                            : [...current, resolveCatalogRole(role).id],
                        )
                      }
                    >
                      <Glyph name="star" size={18} filled={favorites.includes(resolveCatalogRole(role).id)} />
                    </button>}
                    <button
                      type="button"
                      className="settings-mini-button settings-role-info"
                      aria-label={`О роли ${role}`}
                      onClick={() => onRoleInfo?.(role)}
                    >
                      <Glyph name="info" size={18} />
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="settings-empty">Роли не найдены</p>
          )}
        </div>
      </>
    ) : (
      <div className="settings-options">
        {options.map((option) => (
          <div key={option.value} className={panel === 'voice' ? 'settings-voice-option' : undefined}>
          <button
            type="button"
            className={`settings-row settings-option${currentValue === option.value ? " is-selected" : ""}${option.description ? " has-description" : ""}`}
            aria-pressed={currentValue === option.value}
            onClick={() => choose(option.value)}
          >
            {option.icon && panel !== "voice" && <Glyph name={option.icon} />}
            <span className="settings-option-copy">
              <span>{option.value}</span>
              {option.description && (
                <span className="settings-description">
                  {option.description}
                </span>
              )}
            </span>
            {option.hint && (
              <span className="settings-value">{option.hint}</span>
            )}
            <Boost value={option.boost} />
            {currentValue === option.value && <Glyph name="check" size={16} />}
          </button>
          {panel === 'voice' && <button type="button" className="settings-voice-preview" aria-label={`${previewingVoice === option.value ? 'Остановить' : 'Прослушать'} голос ${option.value}`} aria-pressed={previewingVoice === option.value} onClick={() => {
            stopVoice.current?.();
            if (previewingVoice === option.value) { setPreviewingVoice(null); return; }
            setVoiceNotice('');
            try { stopVoice.current = previewVoice(option.value, settings.language, () => setPreviewingVoice(null)); setPreviewingVoice(option.value); }
            catch (error) { setVoiceNotice(error.message); setPreviewingVoice(null); }
          }}><Icon name={previewingVoice === option.value ? 'stop' : 'play'} size={14}/></button>}
          </div>
        ))}
        {voiceNotice && <p className="settings-description" role="status">{voiceNotice}</p>}
      </div>
    );

  const sheetHeader = (
    <div className="settings-sheet-header">
      {canGoBack && (
        <button
          type="button"
          className="settings-back"
          aria-label="Назад к настройкам"
          onClick={() => openPanel("main")}
        >
          <Glyph name="arrowLeft" size={20} />
        </button>
      )}
      <span>{SETTINGS_TITLES[panel] || "Настройки чата"}</span>
      <button
        type="button"
        className="settings-close"
        aria-label="Закрыть настройки"
        onClick={onClose}
      >
        <Glyph name="close" size={20} />
      </button>
    </div>
  );

  const content = (
    <div
      ref={root}
      className={`settings-layer${mobile ? " settings-mobile" : direct ? ` settings-direct settings-direct-${panel}` : ""}`}
      data-state={opened ? "open" : "closed"}
      tabIndex={-1}
      onKeyDown={keyDown}
      role={mobile ? "dialog" : undefined}
      aria-modal={mobile ? "true" : undefined}
      aria-label={direct ? SETTINGS_TITLES[panel] : "Настройки чата"}
    >
      {mobile ? (
        <>
          <div className="settings-overlay" onClick={onClose} />
          <div
            className={`settings-panel settings-sheet settings-sheet-${panel}`}
          >
            <span className="settings-sheet-handle" />
            {sheetHeader}
            <div className="settings-sheet-content">
              {panel === "main" ? mainContent : submenuContent}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="settings-panel settings-main">
            <div className="settings-section-title">
              {direct ? SETTINGS_TITLES[panel] : "Настройки чата"}
            </div>
            {direct ? submenuContent : mainContent}
          </div>
          {showSubmenu && (
            <div
              key={panel}
              className={`settings-panel settings-submenu settings-submenu-${panel}`}
              aria-label={SETTINGS_TITLES[panel]}
            >
              <div className="settings-submenu-header">{sheetHeader}</div>
              {submenuContent}
            </div>
          )}
        </>
      )}
    </div>
  );
  return mobile ? createPortal(content, document.body) : content;
}
