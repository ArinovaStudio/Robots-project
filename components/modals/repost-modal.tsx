"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Globe, Users, ChevronDown, Eye, MessageCircle, Smile, Check } from "lucide-react";
import { toast } from "sonner";
import EmbeddedPost from "@/components/home/embedded-post";

type Audience = "ANYONE" | "CONNECTIONS";

interface RepostModalProps {
  post: any; 
  currentUser: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const AUDIENCE_SHORT: Record<Audience, string> = { ANYONE: "Anyone", CONNECTIONS: "Connections" };
const EMOJIS = ["👍", "👏", "🎉", "❤️", "😂", "🔥", "🙌", "💡", "🚀", "🤝"];

const AUDIENCE_OPTIONS: { value: Audience; title: string; description: string; icon: React.ReactNode }[] = [
  { value: "ANYONE", title: "Anyone", description: "Anyone on or off the platform", icon: <Globe size={16} /> },
  { value: "CONNECTIONS", title: "Connections only", description: "Only your connections", icon: <Users size={16} /> },
];

const pillClass =
  "inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200";

// Pill button that opens a small selection dropdown right below it
function PillDropdown({
  icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: Audience;
  onChange: (v: Audience) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${pillClass} disabled:opacity-60`}
      >
        {icon}
        {label}: {AUDIENCE_SHORT[value]}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${value === opt.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                {opt.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{opt.title}</p>
                <p className="truncate text-xs text-slate-500">{opt.description}</p>
              </div>
              {value === opt.value && <Check size={16} className="shrink-0 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RepostModal({ post, currentUser, onClose, onSuccess }: RepostModalProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Audience>("ANYONE");
  const [commentAccess, setCommentAccess] = useState<Audience>("ANYONE");
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const userName = currentUser?.company?.companyName || currentUser?.name || "You";
  const userImage = currentUser?.company?.logoUrl || currentUser?.image;

  const submit = async (mode: "instant" | "thoughts") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "instant" ? { mode } : { mode, content, visibility, commentAccess }
        ),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Reposted");
        onSuccess?.();
        onClose();
      } else if (res.status === 409) {
        toast.error(json.message || "This post has already been reposted");
        onSuccess?.();
        onClose();
      } else {
        toast.error(json.message || "Failed to repost");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const content_ = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="p-6 pb-4">
          {/* Author row */}
          <div className="flex items-start gap-4 pr-10">
            {userImage ? (
              <img src={userImage} alt={userName} className="h-14 w-14 shrink-0 rounded-full object-cover border border-slate-100" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-slate-900">{userName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PillDropdown
                  icon={<Eye size={16} />}
                  label="Post to"
                  value={visibility}
                  onChange={setVisibility}
                  disabled={submitting}
                />
                <PillDropdown
                  icon={<MessageCircle size={16} />}
                  label="Comments"
                  value={commentAccess}
                  onChange={setCommentAccess}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Thoughts */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={3000}
            autoFocus
            placeholder="Add your thoughts (Optional)"
            className="mt-6 min-h-[100px] w-full resize-none bg-transparent text-xl text-slate-800 outline-none placeholder:text-slate-400"
          />

          {/* Embedded post */}
          <div className="mt-4">
            <EmbeddedPost post={post} compact />
          </div>

          {/* Emoji */}
          <div className="relative mt-6">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Add emoji"
            >
              <Smile size={26} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setContent((prev) => (prev + emoji).slice(0, 3000));
                      setShowEmoji(false);
                    }}
                    className="rounded-lg p-1.5 text-xl transition hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4">
          <button
            onClick={() => submit(content.trim() ? "thoughts" : "instant")}
            disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-7 py-2.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Repost
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content_, document.body);
}