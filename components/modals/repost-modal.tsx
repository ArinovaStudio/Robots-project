"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Repeat2, PenSquare, Globe, Users, ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import EmbeddedPost from "@/components/home/embedded-post";

type Audience = "ANYONE" | "CONNECTIONS";

interface RepostModalProps {
  post: any; 
  currentUser: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const AUDIENCE_LABEL: Record<Audience, string> = { ANYONE: "Anyone", CONNECTIONS: "Connections only" };

export default function RepostModal({ post, currentUser, onClose, onSuccess }: RepostModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"choose" | "compose" | "settings">("choose");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Audience>("ANYONE");
  const [commentAccess, setCommentAccess] = useState<Audience>("ANYONE");
  const [submitting, setSubmitting] = useState(false);

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

  const AudienceOption = ({
    value, current, onPick, title, description, icon,
  }: { value: Audience; current: Audience; onPick: (v: Audience) => void; title: string; description: string; icon: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        current === value ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${current === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <span className={`h-4 w-4 rounded-full border-2 ${current === value ? "border-blue-600 bg-blue-600 ring-2 ring-white ring-inset" : "border-slate-300"}`} />
    </button>
  );

  const content_ = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step === "settings" && (
              <button onClick={() => setStep("compose")} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full transition" aria-label="Back">
                <ArrowLeft size={18} />
              </button>
            )}
            <h3 className="text-lg font-bold text-slate-900">
              {step === "choose" ? "Repost" : step === "compose" ? "Repost with your thoughts" : "Post settings"}
            </h3>
          </div>
          <button onClick={onClose} disabled={submitting} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: choose mode */}
        {step === "choose" && (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => setStep("compose")}
              disabled={submitting}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <PenSquare size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Repost with your thoughts</p>
                <p className="text-xs text-slate-500">Create a new post with this post attached</p>
              </div>
            </button>
            <button
              onClick={() => submit("instant")}
              disabled={submitting}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:opacity-60"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Repeat2 size={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Repost</p>
                <p className="text-xs text-slate-500">Instantly bring this post to others' feeds</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: compose */}
        {step === "compose" && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              {userImage ? (
                <img src={userImage} alt={userName} className="h-11 w-11 rounded-full object-cover border border-slate-100" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-600">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
                <button
                  onClick={() => setStep("settings")}
                  className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {visibility === "ANYONE" ? <Globe size={12} /> : <Users size={12} />}
                  {AUDIENCE_LABEL[visibility]}
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={3000}
              autoFocus
              placeholder="What do you want to talk about?"
              className="mt-4 min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <div className="mt-3">
              <EmbeddedPost post={post} compact />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setStep("settings")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Post settings
              </button>
              <button
                onClick={() => submit("thoughts")}
                disabled={submitting || !content.trim()}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Post
              </button>
            </div>
          </div>
        )}

        {/* Step 3: settings */}
        {step === "settings" && (
          <div className="mt-4 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Who can see your post?</h4>
              <p className="mb-3 text-xs text-slate-500">Choose who can view this repost.</p>
              <div className="space-y-2">
                <AudienceOption value="ANYONE" current={visibility} onPick={setVisibility} title="Anyone" description="Anyone on or off the platform" icon={<Globe size={16} />} />
                <AudienceOption value="CONNECTIONS" current={visibility} onPick={setVisibility} title="Connections only" description="Only your connections" icon={<Users size={16} />} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Who can comment on your post?</h4>
              <p className="mb-3 text-xs text-slate-500">Choose who can join the conversation.</p>
              <div className="space-y-2">
                <AudienceOption value="ANYONE" current={commentAccess} onPick={setCommentAccess} title="Anyone" description="Anyone who can see the post" icon={<Globe size={16} />} />
                <AudienceOption value="CONNECTIONS" current={commentAccess} onPick={setCommentAccess} title="Connections only" description="Only your connections" icon={<Users size={16} />} />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep("compose")}
                className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content_, document.body);
}
