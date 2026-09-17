import { useCallback, useEffect, useRef, useState } from "react";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
let openModalCount = 0;
let modalStack = [];

// Both Figma dialogs share keyboard handling, scroll locking and focus restoration.
export function useModalBehavior(onClose, initialFocusRef) {
  const dialogRef = useRef(null);
  const callbackRef = useRef(onClose);
  const closeTimer = useRef(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  callbackRef.current = onClose;

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const immediate =
      document.body.dataset.input === "keyboard" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (immediate) {
      callbackRef.current?.();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => callbackRef.current?.(), 130);
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousComposer = previousFocus?.closest?.(".chat-composer");
    const fallbackTrigger = document.querySelector(
      '[data-settings-trigger][aria-expanded="true"]',
    );
    const fallbackComposer =
      previousComposer || fallbackTrigger?.closest(".chat-composer");
    // A class avoids restoring a stale inline overflow value when a settings sheet
    // is still exiting underneath this dialog.
    openModalCount += 1;
    const currentDialog = dialogRef.current;
    modalStack.push(currentDialog);
    document.body.classList.add("molecula-dialog-open");
    // Do not summon the mobile keyboard before the user touches the search field.
    const focusTarget = window.matchMedia("(max-width: 700px)").matches
      ? dialogRef.current
      : initialFocusRef?.current || dialogRef.current;
    focusTarget?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (modalStack.at(-1) !== currentDialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }
      if (event.key !== "Tab") return;
      const visible = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.getClientRects().length > 0,
      );
      const first = visible[0];
      const last = visible.at(-1);
      if (!first) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const containFocus = (event) => {
      if (modalStack.at(-1) !== currentDialog) return;
      if (!dialogRef.current || dialogRef.current.contains(event.target))
        return;
      // Native focus moves from another closing overlay must not escape the modal.
      (initialFocusRef?.current || dialogRef.current).focus({
        preventScroll: true,
      });
    };
    document.addEventListener("focusin", containFocus);
    return () => {
      window.clearTimeout(closeTimer.current);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", containFocus);
      modalStack = modalStack.filter((dialog) => dialog !== currentDialog);
      openModalCount = Math.max(0, openModalCount - 1);
      if (!openModalCount)
        document.body.classList.remove("molecula-dialog-open");
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
      else if (fallbackTrigger?.isConnected)
        fallbackTrigger.focus({ preventScroll: true });
      else if (fallbackComposer?.isConnected)
        fallbackComposer
          .querySelector("[data-composer-input]")
          ?.focus({ preventScroll: true });
    };
  }, [initialFocusRef, requestClose]);

  return { dialogRef, closing, requestClose };
}
