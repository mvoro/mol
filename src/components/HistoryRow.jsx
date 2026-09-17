import React, { useEffect, useRef, useState } from "react";
import {
  DotsThree,
} from "../outline-icons.jsx";
import { MODE_NAMES, ModeIcon } from "../ui.jsx";
import { getChatModes } from "../history-types.js";
import { Popover } from "./Popover.jsx";
import { ChatActions } from "./ChatActions.jsx";
import "./history-row.css";

export function HistoryRow({
  chat,
  active = false,
  onOpen,
  onAction,
  compact = false,
}) {
  const rowRef = useRef(null);
  const moreRef = useRef(null);
  const gesture = useRef(null);
  const holdTimer = useRef(null);
  const suppressClick = useRef(false);
  const touchContext = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const modes = getChatModes(chat);

  useEffect(() => {
    const cancel = () => {
      window.clearTimeout(holdTimer.current);
      if (gesture.current) {
        gesture.current.cancelled = true;
        suppressClick.current = true;
        setRevealed(false);
      }
    };
    const down = (event) => {
      if (gesture.current && event.pointerId !== gesture.current.id) cancel();
      if (!rowRef.current?.contains(event.target)) setRevealed(false);
    };
    const move = (event) => {
      const press = gesture.current;
      if (
        press?.id === event.pointerId &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10
      )
        cancel();
    };
    const end = (event) => {
      if (gesture.current?.id !== event.pointerId) return;
      window.clearTimeout(holdTimer.current);
      if (
        event.type === "pointercancel" ||
        gesture.current.held ||
        gesture.current.cancelled
      )
        suppressClick.current = true;
      if (event.type === "pointercancel") setRevealed(false);
      gesture.current = null;
    };
    const scroll = () => {
      cancel();
      setRevealed(false);
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", end, true);
    document.addEventListener("pointercancel", end, true);
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.clearTimeout(holdTimer.current);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", end, true);
      document.removeEventListener("pointercancel", end, true);
      window.removeEventListener("scroll", scroll, true);
    };
  }, []);

  const startHold = (event) => {
    touchContext.current = event.pointerType !== "mouse";
    if (!touchContext.current) suppressClick.current = false;
    if (
      !touchContext.current ||
      event.button > 0 ||
      event.isPrimary === false ||
      gesture.current
    )
      return;
    suppressClick.current = false;
    const press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      held: false,
      cancelled: false,
    };
    gesture.current = press;
    holdTimer.current = window.setTimeout(() => {
      if (gesture.current !== press || press.cancelled) return;
      press.held = true;
      suppressClick.current = true;
      setRevealed(true);
    }, 500);
  };
  const choose = (action) => {
    setOpen(false);
    setRevealed(false);
    onAction?.(action, chat);
  };

  return (
    <div
      ref={rowRef}
      className={`history-row${compact ? " history-row-compact" : ""}${active ? " is-current" : ""}`}
      data-revealed={revealed || undefined}
      data-menu-open={open || undefined}
      style={{
        "--history-mode-width": `${Math.max(28, modes.length * 11 + 5)}px`,
      }}
    >
      <button
        type="button"
        className="history-row-main"
        title={chat.title}
        aria-current={active ? "page" : undefined}
        onPointerDown={startHold}
        onContextMenu={(event) => {
          if (touchContext.current || revealed) event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (
            event.key === "ContextMenu" ||
            (event.shiftKey && event.key === "F10")
          ) {
            event.preventDefault();
            setRevealed(true);
            setOpen(true);
          }
        }}
        onClick={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          setRevealed(false);
          onOpen?.(chat);
        }}
      >
        <span>{chat.title}</span>
      </button>
      <div className="history-row-affordance">
        <span
          className="history-row-modes"
          role="img"
          aria-label={`Режимы чата: ${modes.map((mode) => MODE_NAMES[mode]).join(", ")}`}
          title={modes.map((mode) => MODE_NAMES[mode]).join(" · ")}
        >
          {modes.map((mode) => (
            <ModeIcon key={mode} mode={mode} size={16} />
          ))}
        </span>
        <button
          ref={moreRef}
          type="button"
          className="history-row-more"
          aria-label={`Действия с чатом «${chat.title}»`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            setRevealed(true);
            setOpen((value) => !value);
          }}
        >
          <DotsThree size={20} weight="regular" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <Popover
          anchorRef={moreRef}
          label={`Действия с чатом «${chat.title}»`}
          className="history-row-menu"
          onClose={() => {
            setOpen(false);
            setRevealed(false);
          }}
        >
          <ChatActions chat={chat} onAction={choose}/>
        </Popover>
      )}
    </div>
  );
}
