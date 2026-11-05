"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ReactionIcon from "@/components/home/reaction-icon";
import { POST_REACTION_TYPES, REACTION_META, type PostReactionType, type ReactionCounts } from "@/lib/reactions";

type Tab = "ALL" | PostReactionType;

interface Reactor {
  id: string;
  type: PostReactionType;
  isYou: boolean;
  isConnection: boolean;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    verificationStatus?: string | null;
    company?: { companyName: string; logoUrl: string | null; location: string | null } | null;
  };
}

interface ReactionsModalProps {
  postId: string;
  initialCounts?: ReactionCounts;
  initialTotal?: number;
  onClose: () => void;
}

export default function ReactionsModal({ postId, initialCounts = {}, initialTotal = 0, onClose }: ReactionsModalProps) {
  const [tab, setTab] = useState<Tab>("ALL");
  const [items, setItems] = useState<Reactor[]>([]);
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Parents usually pass an inline arrow; keep the latest one in a ref so re-renders don't re-run the focus effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const load = useCallback(
    async (nextTab: Tab, nextPage: number) => {
      const id = ++requestId.current;
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const qs = new URLSearchParams({ page: String(nextPage) });
        if (nextTab !== "ALL") qs.set("type", nextTab);
        const res = await fetch(`/api/posts/${postId}/reactions?${qs}`, { cache: "no-store" });
        const json = await res.json();
        if (id !== requestId.current) return; 
        if (!json.success) throw new Error(json.message || "Could not load reactions");

        setItems((prev) => (nextPage === 1 ? json.data : [...prev, ...json.data]));
        setCounts(json.counts || {});
        setTotal(json.total || 0);
        setHasMore(!!json.pagination?.hasMore);
        setPage(nextPage);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e instanceof Error ? e.message : "Could not load reactions");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [postId]
  );

  useEffect(() => {
    setItems([]);
    load(tab, 1);
  }, [tab, load]);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const tabs: { key: Tab; label: string; type?: PostReactionType; count: number }[] = [
    { key: "ALL", label: "All", count: total },
    ...POST_REACTION_TYPES.filter((t) => (counts[t] ?? 0) > 0).map((t) => ({
      key: t as Tab,
      label: REACTION_META[t].label,
      type: t,
      count: counts[t] ?? 0,
    })),
  ];

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reactions-title"
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 id="reactions-title" className="text-base font-bold text-gray-900">Reactions</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div role="tablist" aria-label="Filter by reaction" className="flex overflow-x-auto border-b border-gray-100 px-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.type && <ReactionIcon type={t.type} size={18} />}
              {t.label} <span className="tabular-nums">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[12rem] flex-1 overflow-y-auto">
          {loading ? (
            <ul aria-busy="true" aria-label="Loading reactions">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
                  <div className="h-11 w-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-2.5 w-20 rounded bg-gray-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-gray-600">{error}</p>
              <button
                type="button"
                onClick={() => load(tab, 1)}
                className="rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">No reactions yet.</p>
          ) : (
            <>
              <ul>
                {items.map((r) => {
                  const u = r.user;
                  const name = u.company?.companyName || u.name || "Independent Professional";
                  const avatar = u.company?.logoUrl || u.image;
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <Link href={`/profile/${u.id}`} onClick={onClose} className="relative shrink-0" aria-label={`View ${name}'s profile`}>
                        {avatar ? (
                          <img src={avatar} alt="" className="h-11 w-11 rounded-full border border-gray-100 object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-600">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span title={REACTION_META[r.type].label} className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-white">
                          <ReactionIcon type={r.type} size={20} />
                          <span className="sr-only">{REACTION_META[r.type].label}</span>
                        </span>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profile/${u.id}`}
                          onClick={onClose}
                          className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          <span className="truncate">{name}{r.isYou ? " (You)" : ""}</span>
                          <VerificationBadge status={u.verificationStatus} size="xs" />
                        </Link>
                        {u.company?.location && <p className="truncate text-xs text-gray-500">{u.company.location}</p>}
                      </div>
                      {r.isConnection && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Connection</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {error && <p className="px-4 pb-2 text-center text-xs text-red-600">{error}</p>}
              {hasMore && (
                <div className="flex justify-center px-4 py-3">
                  <button
                    type="button"
                    onClick={() => load(tab, page + 1)}
                    disabled={loadingMore}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {loadingMore ? "Loading…" : "Show more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
