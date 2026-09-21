import React, { useRef, useState } from "react";
import { Ellipsis } from 'lucide-react';
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
  const moreRef = useRef(null);
  const [open, setOpen] = useState(false);
  const modes = getChatModes(chat);

  const choose = (action) => {
    setOpen(false);
    onAction?.(action, chat);
  };

  return (
    <div
      className={`history-row${compact ? " history-row-compact" : ""}${active ? " is-current" : ""}`}
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
        onKeyDown={(event) => {
          if (
            event.key === "ContextMenu" ||
            (event.shiftKey && event.key === "F10")
          ) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        onClick={() => onOpen?.(chat)}
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
          onClick={() => setOpen((value) => !value)}
        >
          <Ellipsis size={20} aria-hidden="true" strokeWidth={1.75}/>
        </button>
      </div>
      {open && (
        <Popover
          anchorRef={moreRef}
          label={`Действия с чатом «${chat.title}»`}
          className="history-row-menu"
          onClose={() => setOpen(false)}
        >
          <ChatActions chat={chat} onAction={choose}/>
        </Popover>
      )}
    </div>
  );
}
