"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, MessageSquare, ArrowRight, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/ui/VerificationBadge";
import RequestsBoard from "./requests-board";
import RequestDetailsModal from "./request-details-modal";
import StatusBadge from "./status-badge";
import { formatRelativeTime } from "./utils";

// An investor -> business request = an investment offer made on one of the business's pitches.
interface ReceivedOffer {
  id: string;
  pitchId: string;
  pitchTitle: string;
  pitchSector: string | null;
  pitchStage: string | null;
  pitchTargetAmount: string | null;
  amount: string;
  amountValue: number;
  terms: string | null;
  message: string | null;
  status: string; // PENDING | ACCEPTED | DECLINED
  createdAt: string;
  investorId: string;
  name: string | null;
  image: string | null;
  verificationStatus?: string | null;
  firmName: string | null;
  investorType: string | null;
  location: string | null;
}

type FilterKey = "PENDING" | "ACCEPTED" | "DECLINED" | "ALL";
type SortKey = "NEWEST" | "OLDEST" | "HIGH_AMOUNT" | "LOW_AMOUNT";

interface InvestorRequestsPanelProps {
  onPendingCountChange?: (count: number) => void;
}

export default function InvestorRequestsPanel({ onPendingCountChange }: InvestorRequestsPanelProps) {
  const [offers, setOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("PENDING");
  const [sortBy, setSortBy] = useState<SortKey>("NEWEST");
  const [selected, setSelected] = useState<ReceivedOffer | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/company/pitches/offers");
        const json = res.ok ? await res.json() : null;
        if (active && json?.success && Array.isArray(json.data)) setOffers(json.data);
      } catch (err) {
        console.error("Failed to load investor requests:", err);
        if (active) toast.error("Could not load investor requests.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      pending: offers.filter((o) => o.status === "PENDING").length,
      accepted: offers.filter((o) => o.status === "ACCEPTED").length,
      declined: offers.filter((o) => o.status === "DECLINED").length,
    }),
    [offers]
  );

  useEffect(() => {
    onPendingCountChange?.(stats.pending);
  }, [stats.pending, onPendingCountChange]);

  const visible = useMemo(() => {
    const list = offers.filter((o) => activeFilter === "ALL" || o.status === activeFilter);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "HIGH_AMOUNT":
          return b.amountValue - a.amountValue;
        case "LOW_AMOUNT":
          return a.amountValue - b.amountValue;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [offers, activeFilter, sortBy]);

  const respond = async (id: string, action: "ACCEPTED" | "DECLINED") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/company/pitches/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: action } : o)));
        setSelected((prev) => (prev && prev.id === id ? { ...prev, status: action } : prev));
        toast.success(action === "ACCEPTED" ? "Offer accepted!" : "Offer declined.");
      } else {
        toast.error(data.message || "Failed to update offer.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const nameOf = (o: ReceivedOffer) => o.name || o.firmName || "Investor";

  const actionButtons = (o: ReceivedOffer) => {
    const busy = processingId === o.id;
    const message = (
      <Link
        href={`/messages/${o.investorId}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-2xs"
      >
        <MessageSquare size={13} />
        <span>Message Investor</span>
      </Link>
    );
    if (o.status === "PENDING") {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => respond(o.id, "DECLINED")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <X size={13} />
            <span>Decline</span>
          </button>
          <Link
            href={`/messages/${o.investorId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
          >
            <MessageSquare size={13} />
            <span>Message</span>
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => respond(o.id, "ACCEPTED")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
            <span>Accept</span>
          </button>
        </>
      );
    }
    if (o.status === "ACCEPTED") return message;
    return null;
  };

  return (
    <>
      <RequestsBoard
        stats={[
          { label: "Awaiting review", value: stats.pending, caption: "Needs your decision", icon: <Clock size={18} />, tone: "emerald" },
          { label: "Accepted", value: stats.accepted, caption: "Ready to connect", icon: <CheckCircle2 size={18} />, tone: "emerald" },
          { label: "Declined", value: stats.declined, caption: "Closed offers", icon: <XCircle size={18} />, tone: "amber" },
        ]}
        filters={[
          { key: "PENDING", label: "Pending", count: stats.pending },
          { key: "ACCEPTED", label: "Accepted", count: stats.accepted },
          { key: "DECLINED", label: "Declined", count: stats.declined },
          { key: "ALL", label: "All requests" },
        ]}
        activeFilter={activeFilter}
        onFilterChange={(k) => setActiveFilter(k as FilterKey)}
        sortOptions={[
          { key: "NEWEST", label: "Recently received" },
          { key: "OLDEST", label: "Oldest first" },
          { key: "HIGH_AMOUNT", label: "Highest offer" },
          { key: "LOW_AMOUNT", label: "Lowest offer" },
        ]}
        sortBy={sortBy}
        onSortChange={(k) => setSortBy(k as SortKey)}
        loading={loading}
        isEmpty={visible.length === 0}
        emptyTitle={activeFilter === "ALL" ? "No investor requests yet" : `No ${activeFilter.toLowerCase()} investor requests`}
        emptyDescription="When an investor sends an investment offer on one of your pitches, it will appear here for your review."
      >
        {visible.map((o) => {
          const name = nameOf(o);
          return (
            <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 hover:border-gray-300 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/profile/${o.investorId}`}
                    className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden text-blue-700 font-bold text-base"
                  >
                    {o.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{name.charAt(0).toUpperCase()}</span>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/profile/${o.investorId}`} className="text-base font-bold text-gray-900 truncate hover:text-blue-600 hover:underline">
                        {name}
                      </Link>
                      <VerificationBadge status={o.verificationStatus || "UNVERIFIED"} size="xs" />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {[o.firmName && o.firmName !== name ? o.firmName : null, o.investorType].filter(Boolean).join(" • ") || "Investor"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-gray-900 leading-snug">Offer on “{o.pitchTitle}”</h4>
                {o.message && <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{o.message}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Offer amount</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{o.amount}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Terms</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{o.terms || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{o.location || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Received</span>
                  <span className="mt-0.5 block text-xs font-medium text-gray-600">{formatRelativeTime(o.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  <span>View offer details</span>
                  <ArrowRight size={13} />
                </button>
                <div className="flex items-center gap-2 self-end sm:self-auto">{actionButtons(o)}</div>
              </div>
            </div>
          );
        })}
      </RequestsBoard>

      {selected && (
        <RequestDetailsModal
          title={`${nameOf(selected)} → ${selected.pitchTitle}`}
          subtitle={`Received ${formatRelativeTime(selected.createdAt)}`}
          badge={<StatusBadge status={selected.status} />}
          sections={[
            { label: "Offer amount", value: selected.amount },
            { label: "Terms", value: selected.terms },
            { label: "Investor's message", value: selected.message },
            { label: "Pitch", value: [selected.pitchTitle, selected.pitchSector, selected.pitchStage].filter(Boolean).join(" • ") },
            { label: "Pitch target", value: selected.pitchTargetAmount },
          ]}
          actions={actionButtons(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}