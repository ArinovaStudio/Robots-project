"use client";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, PenSquare, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import RepostModal from "./repost-modal";

interface RepostMenuProps {
  post: any;
  currentUser: any;
  onSuccess?: () => void;
  className?: string; // wrapper classes, e.g. "flex flex-1" inside a flex action bar
  trigger: (args: { onClick: () => void; open: boolean; submitting: boolean }) => ReactNode;
}

const GAP = 8; // space between the button and the menu / screen edge
const MENU_WIDTH = 256; // matches w-64

export default function RepostMenu({
  post,
  currentUser,
  onSuccess,
  className = "inline-block",
  trigger,
}: RepostMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the menu in viewport coordinates: below the button if it fits, otherwise above.
  // Runs before paint, so the menu never visibly jumps.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const wrap = ref.current;
    const menu = menuRef.current;
    if (!wrap || !menu) return;

    const rect = wrap.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeBelow = spaceBelow >= menuHeight + GAP * 2 || spaceBelow >= spaceAbove;

    const top = placeBelow ? rect.bottom + GAP : Math.max(GAP, rect.top - menuHeight - GAP);
    const left = Math.min(Math.max(GAP, rect.left), window.innerWidth - MENU_WIDTH - GAP);
    setPos({ top, left });
  }, [open]);

  // close on outside click / Escape / scroll / resize (the menu is fixed, so it would drift otherwise)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const repostInstantly = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "instant" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Reposted");
        onSuccess?.();
      } else if (res.status === 409) {
        toast.error(json.message || "This post has already been reposted");
        onSuccess?.(); // sync the card so it knows the post is reposted
      } else {
        toast.error(json.message || "Failed to repost");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  };

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: MENU_WIDTH,
        visibility: pos ? "visible" : "hidden", // hidden until measured, so there's no flash
      }}
      className="z-[9000] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setOpen(false);
          setShowModal(true);
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        <PenSquare size={18} className="shrink-0 text-slate-600" />
        Repost with thoughts
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={repostInstantly}
        disabled={submitting}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 size={18} className="shrink-0 animate-spin text-slate-600" />
        ) : (
          <Repeat2 size={18} className="shrink-0 text-slate-600" />
        )}
        Repost instantly
      </button>
    </div>
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {trigger({ onClick: () => setOpen((v) => !v), open, submitting })}

      {open && createPortal(menu, document.body)}

      {showModal && (
        <RepostModal
          post={post}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}