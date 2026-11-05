"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { POST_REACTION_TYPES, REACTION_META, type PostReactionType } from "@/lib/reactions";
import ReactionIcon from "./reaction-icon";

const HOVER_OPEN_MS = 400;
const HOVER_CLOSE_MS = 300;
const LONG_PRESS_MS = 450;

interface ReactionButtonProps {
  value: PostReactionType | null;
  /** Called with the chosen reaction (tap = LIKE, picker = any type). */
  onSelect: (type: PostReactionType) => void;
  /** Called when the viewer taps the button / picks the reaction they already have. */
  onRemove: () => void;
}

/**
 * LinkedIn-style reaction button: tap to Like / un-react, hover (mouse) or long-press (touch)
 * to open the reaction picker. Arrow-up opens the picker from the keyboard.
 */
export default function ReactionButton({ value, onSelect, onRemove }: ReactionButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clear = (ref: { current: ReturnType<typeof setTimeout> | null }) => {
    if (ref.current) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  useEffect(() => () => {
    clear(openTimer);
    clear(closeTimer);
    clear(pressTimer);
  }, []);

  // Close on outside press / Escape while the picker is open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = useCallback(
    (type: PostReactionType) => {
      setOpen(false);
      if (type === value) onRemove();
      else onSelect(type);
    },
    [value, onSelect, onRemove]
  );

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clear(closeTimer);
    if (!open && !openTimer.current) openTimer.current = setTimeout(() => { openTimer.current = null; setOpen(true); }, HOVER_OPEN_MS);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clear(openTimer);
    clear(closeTimer);
    closeTimer.current = setTimeout(() => { closeTimer.current = null; setOpen(false); }, HOVER_CLOSE_MS);
  };

  const startPress = () => {
    longPressed.current = false;
    clear(pressTimer);
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      longPressed.current = true;
      setOpen(true);
    }, LONG_PRESS_MS);
  };

  const endPress = () => clear(pressTimer);

  const handleClick = () => {
    clear(openTimer);
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    setOpen(false);
    if (value) onRemove();
    else onSelect("LIKE");
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => pickerRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
    }
  };

  const handlePickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const items = Array.from(pickerRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowRight" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const meta = value ? REACTION_META[value] : null;

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-1"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {open && (
        <div
          ref={pickerRef}
          role="toolbar"
          aria-label="Choose a reaction"
          onKeyDown={handlePickerKeyDown}
          className="absolute bottom-full left-0 z-30 mb-1 flex items-end gap-0.5 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-150"
        >
          {POST_REACTION_TYPES.map((type) => {
            const item = REACTION_META[type];
            return (
              <button
                key={type}
                type="button"
                aria-label={item.label}
                aria-pressed={value === type}
                onClick={() => choose(type)}
                className={`group/reaction relative flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-blue-500 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-125 motion-safe:focus-visible:-translate-y-1.5 motion-safe:focus-visible:scale-125 ${value === type ? "bg-gray-100" : ""}`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover/reaction:opacity-100 group-focus-visible/reaction:opacity-100"
                >
                  {item.label}
                </span>
                <ReactionIcon type={type} size={32} />
              </button>
            );
          })}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-pressed={!!value}
        onClick={handleClick}
        onKeyDown={handleButtonKeyDown}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => { if (longPressed.current) e.preventDefault(); }}
        className={`flex flex-1 select-none items-center justify-center gap-2 rounded-md px-2 py-3 text-sm font-medium transition-colors [-webkit-touch-callout:none] ${
          meta ? `${meta.textClass} hover:bg-gray-100` : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {meta ? (
          <ReactionIcon type={value!} size={20} />
        ) : (
          <ThumbsUp size={18} />
        )}
        {meta ? meta.label : "Like"}
      </button>
    </div>
  );
}
