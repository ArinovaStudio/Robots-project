"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, MessageSquare, ArrowRight, Loader2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/ui/VerificationBadge";
import RequestsBoard from "./requests-board";
import RequestDetailsModal from "./request-details-modal";
import StatusBadge from "./status-badge";
import { formatRelativeTime } from "./utils";
import SendPitchRequestModal, { type ExistingPitchRequest } from "@/components/modals/send-pitch-request-modal";
import InfoRequestDialog from "@/components/info-requests/info-request-dialog";
import InfoRequestAction from "@/components/info-requests/info-request-action";

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
  status: string; // PENDING | ACCEPTED | INFO_REQUESTED | DECLINED
  createdAt: string;
  investorId: string;
  name: string | null;
  image: string | null;
  verificationStatus?: string | null;
  firmName: string | null;
  investorType: string | null;
  location: string | null;
  // Only set for pitch requests the business sent; used to prefill the edit form.
  pitchRequest?: ExistingPitchRequest;
  // "collaboration" = a MarketplaceCollaboration proposal between this business and an investor
  kind?: "collaboration";
  targetOpportunity?: string | null;
  documentUrl?: string | null;
}

type InfoType = "INVESTMENT_OFFER" | "PITCH_REQUEST" | "BUSINESS_COLLABORATION";
// Questions are stored under the type of the request they belong to. A pitch request this business
// sent is the only row carrying `pitchRequest`, and its questions live under PITCH_REQUEST.
const infoTypeOf = (o: Pick<ReceivedOffer, "kind" | "pitchRequest">): InfoType =>
  o.kind === "collaboration" ? "BUSINESS_COLLABORATION" : o.pitchRequest ? "PITCH_REQUEST" : "INVESTMENT_OFFER";

function offeringOf(offerings: unknown, label: string): string {
  const list = Array.isArray(offerings) ? offerings : [];
  const hit = list.find((o) => typeof o === "string" && o.startsWith(`${label}:`)) as string | undefined;
  return hit ? hit.slice(label.length + 1).trim() : "";
}

// Maps a MarketplaceCollaboration row to the card shape. `other` is the investor on the other side.
function mapCollaboration(c: any, other: any, otherId: string): ReceivedOffer {
  const type = c.expectations?.[0] || "Collaboration";
  const amount = offeringOf(c.offerings, "Proposed Investment");
  const participation = offeringOf(c.offerings, "Participation");
  return {
    id: c.id,
    pitchId: c.id,
    pitchTitle: `${type} collaboration${c.contributionDesc ? ` on ${c.contributionDesc}` : ""}`,
    pitchSector: null,
    pitchStage: null,
    pitchTargetAmount: null,
    amount: amount || "—",
    amountValue: parseFloat(amount.replace(/[^0-9.]/g, "")) || 0,
    terms: participation || null,
    message: c.overview || null,
    status: c.status === "COMPLETED" ? "ACCEPTED" : c.status, // PENDING | ACCEPTED | INFO_REQUESTED | DECLINED
    createdAt: c.createdAt,
    investorId: other?.id || otherId,
    name: other?.name ?? null,
    image: other?.image ?? null,
    verificationStatus: other?.verificationStatus ?? null,
    firmName: other?.investor?.firmName ?? null,
    investorType: other?.investor?.investorType || "Investor",
    location: [other?.investor?.city, other?.investor?.country].filter(Boolean).join(", ") || null,
    kind: "collaboration",
    targetOpportunity: c.contributionDesc || null,
    documentUrl: c.resourcesAvailable || null,
  };
}

// Collaboration proposals exchanged with INVESTORS (the business tab never shows these).
async function loadInvestorCollaborations(dir: "received" | "sent"): Promise<ReceivedOffer[]> {
  try {
    const res = await fetch(`/api/marketplace/collaborate?direction=${dir}&counterparty=investor&limit=100`);
    const json = res.ok ? await res.json() : null;
    if (!json?.success || !Array.isArray(json.data)) return [];
    return json.data.map((c: any) =>
      dir === "sent" ? mapCollaboration(c, c.recipient, c.recipientId) : mapCollaboration(c, c.requester, c.requesterId)
    );
  } catch {
    return [];
  }
}

type FilterKey = "PENDING" | "ACCEPTED" | "INFO_REQUESTED" | "DECLINED" | "ALL";
type SortKey = "NEWEST" | "OLDEST" | "HIGH_FUNDING" | "LOW_FUNDING";

function getSortOptions(direction: "received" | "sent") {
  return [
    { key: "NEWEST", label: direction === "sent" ? "Recently sent" : "Recently received" },
    { key: "OLDEST", label: "Oldest first" },
    { key: "HIGH_FUNDING", label: "Highest seeking amount" },
    { key: "LOW_FUNDING", label: "Lowest seeking amount" },
  ];
}

interface InvestorRequestsPanelProps {
  onPendingCountChange?: (count: number) => void;
}

export default function InvestorRequestsPanel({ onPendingCountChange }: InvestorRequestsPanelProps) {
  const [offers, setOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("PENDING");
  const [sortBy, setSortBy] = useState<SortKey>("NEWEST");
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<ReceivedOffer | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReceivedOffer | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [infoDialog, setInfoDialog] = useState<{ id: string; mode: "ask" | "answer" | "view"; type: InfoType } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (direction === "sent") {
          const [res, collabItems] = await Promise.all([fetch("/api/pitch-requests"), loadInvestorCollaborations("sent")]);
          const json = res.ok ? await res.json() : null;
          if (active && !(json?.success && Array.isArray(json.data))) setOffers(collabItems);
          if (active && json?.success && Array.isArray(json.data)) {
            // Map sent pitch requests into displayable offers format
            const mapped: ReceivedOffer[] = json.data.map((p: any) => ({
              id: p.id,
              pitchId: p.id,
              pitchTitle: p.companyName || "Pitch Request",
              pitchSector: p.problemStatement ? p.problemStatement.slice(0, 50) : null,
              pitchStage: "Seed",
              pitchTargetAmount: p.fundingRequirement,
              amount: p.fundingRequirement,
              amountValue: parseFloat(String(p.fundingRequirement).replace(/[^0-9.]/g, "")) || 0,
              terms: p.equityOffered ? `${p.equityOffered} equity` : null,
              message: p.message,
              // Pitch requests call "info asked" REVIEWED; this panel calls it INFO_REQUESTED.
              status: p.status === "REVIEWED" ? "INFO_REQUESTED" : p.status,
              createdAt: p.createdAt,
              investorId: p.investorId,
              name: p.investor?.name || "Investor",
              image: p.investor?.image || null,
              verificationStatus: p.investor?.verificationStatus || null,
              firmName: p.investor?.firmName || null,
              investorType: p.investor?.investorType || "Investor",
              location: p.investor?.location || null,
              pitchRequest: {
                id: p.id,
                companyName: p.companyName,
                problemStatement: p.problemStatement,
                proposedSolution: p.proposedSolution,
                fundingRequirement: p.fundingRequirement,
                equityOffered: p.equityOffered ?? null,
                message: p.message,
              },
            }));
            setOffers([...collabItems, ...mapped]);
          }
        } else {
          const [res, collabItems] = await Promise.all([fetch("/api/company/pitches/offers"), loadInvestorCollaborations("received")]);
          const json = res.ok ? await res.json() : null;
          if (active) setOffers(json?.success && Array.isArray(json.data) ? [...collabItems, ...json.data] : collabItems);
        }
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
  }, [direction, reloadKey]);

  const stats = useMemo(
    () => ({
      pending: offers.filter((o) => o.status === "PENDING").length,
      accepted: offers.filter((o) => o.status === "ACCEPTED").length,
      info: offers.filter((o) => o.status === "INFO_REQUESTED").length,
      declined: offers.filter((o) => o.status === "DECLINED").length,
    }),
    [offers]
  );

  useEffect(() => {
    onPendingCountChange?.(stats.pending);
  }, [stats.pending, onPendingCountChange]);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = offers.filter((o) => {
      if (activeFilter !== "ALL" && o.status !== activeFilter) return false;
      if (q) {
        const name = (o.name || "").toLowerCase();
        const firm = (o.firmName || "").toLowerCase();
        const title = (o.pitchTitle || "").toLowerCase();
        const terms = (o.terms || "").toLowerCase();
        const message = (o.message || "").toLowerCase();
        const matchesQuery =
          name.includes(q) || firm.includes(q) || title.includes(q) || terms.includes(q) || message.includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "HIGH_FUNDING":
          return b.amountValue - a.amountValue;
        case "LOW_FUNDING":
          return a.amountValue - b.amountValue;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [offers, activeFilter, sortBy, searchQuery]);

  const respond = async (id: string, action: "ACCEPTED" | "DECLINED" | "INFO_REQUESTED") => {
    setProcessingId(id);
    try {
      const isCollab = offers.find((o) => o.id === id)?.kind === "collaboration";
      const res = await fetch(isCollab ? "/api/marketplace/collaborate" : `/api/company/pitches/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCollab ? { id, status: action } : { action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: action } : o)));
        setSelected((prev) => (prev && prev.id === id ? { ...prev, status: action } : prev));
        toast.success(
          action === "ACCEPTED" ? "Offer accepted!" : action === "DECLINED" ? "Offer declined." : "Follow-up initiated."
        );
      } else {
        toast.error(data.message || "Failed to update offer.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const cancelPitch = async (id: string) => {
    const isCollab = offers.find((o) => o.id === id)?.kind === "collaboration";
    if (!window.confirm(`Cancel this ${isCollab ? "collaboration request" : "pitch request"}? It will be removed for the investor too.`)) return;
    setProcessingId(id);
    try {
      const res = await fetch(isCollab ? `/api/marketplace/collaborate?id=${id}` : `/api/pitch-requests?id=${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        setSelected((prev) => (prev && prev.id === id ? null : prev));
        toast.success(isCollab ? "Collaboration request cancelled." : "Pitch request cancelled.");
      } else {
        toast.error(data.message || "Failed to cancel pitch request.");
        setReloadKey((k) => k + 1); // status may have changed (e.g. accepted)
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
    // Business viewing a pitch request it sent: it cannot accept/decline its own pitch.
    if (direction === "sent") {
      if (o.status === "PENDING") {
        return (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => cancelPitch(o.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              <span>Cancel</span>
            </button>
            {o.pitchRequest && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Pencil size={13} />
              <span>Edit</span>
            </button>
            )}
          </>
        );
      }
      if (o.status === "ACCEPTED") return message;
      if (o.status === "INFO_REQUESTED") {
        // The investor has responded, so the API no longer allows editing or cancelling this request.
        return <InfoRequestAction requestId={o.id} requestType={infoTypeOf(o)} />;
      }
      return null;
    }
    if (o.status === "INFO_REQUESTED") {
      // Flow: questions sent -> "Pending for reply" -> answers received -> "View answers" + Decline / Accept.
      return (
        <InfoRequestAction
          requestId={o.id}
          requestType={infoTypeOf(o)}
          decisionButtons={
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
          }
        />
      );
    }
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
          <button
            type="button"
            disabled={busy}
            onClick={() => setInfoDialog({ id: o.id, mode: "ask", type: infoTypeOf(o) })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <MessageSquare size={13} />
            <span>Ask for info</span>
          </button>
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
          { label: "Rejected", value: stats.declined, caption: "Closed offers", icon: <XCircle size={18} />, tone: "amber" },
        ]}
        filters={[
          { key: "PENDING", label: "Pending", count: stats.pending },
          { key: "ACCEPTED", label: "Accepted", count: stats.accepted },
          { key: "INFO_REQUESTED", label: "Ask info", count: stats.info },
          { key: "DECLINED", label: "Rejected", count: stats.declined },
          { key: "ALL", label: "All requests" },
        ]}
        activeFilter={activeFilter}
        onFilterChange={(k) => setActiveFilter(k as FilterKey)}
        sortOptions={getSortOptions(direction)}
        sortBy={sortBy}
        onSortChange={(k) => setSortBy(k as SortKey)}
        direction={direction}
        onDirectionChange={(d) => setDirection(d)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search investor requests..."
        loading={loading}
        isEmpty={visible.length === 0}
        emptyTitle={
          searchQuery
            ? `No requests found matching "${searchQuery}"`
            : direction === "sent"
            ? "No sent requests"
            : activeFilter === "ALL"
            ? "No investor requests yet"
            : `No ${activeFilter === "DECLINED" ? "rejected" : activeFilter === "INFO_REQUESTED" ? "ask info" : activeFilter.toLowerCase()} investor requests`
        }
        emptyDescription={
          searchQuery
            ? "Try searching with different keywords or clearing your search."
            : direction === "sent"
            ? "Pitch requests and collaboration requests you send to investors will appear here."
            : "Investment offers on your pitches and collaboration requests from investors will appear here for your review."
        }
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
                <h4 className="text-sm font-bold text-gray-900 leading-snug">
                  {o.kind === "collaboration" ? o.pitchTitle : <>Offer request on “{o.pitchTitle}”</>}
                </h4>
                {o.message && <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{o.message}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{o.kind === "collaboration" ? "Proposed amount" : "Proposed investment"}</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{o.amount}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{o.kind === "collaboration" ? "Participation" : "Suggested terms"}</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{o.terms || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{o.location || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{direction === "sent" ? "Sent" : "Received"}</span>
                  <span className="mt-0.5 block text-xs font-medium text-gray-600">{formatRelativeTime(o.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  <span>View request details</span>
                  <ArrowRight size={13} />
                </button>
                <div className="flex items-center gap-2 self-end sm:self-auto">{actionButtons(o)}</div>
              </div>
            </div>
          );
        })}
      </RequestsBoard>

      {editing?.pitchRequest && (
        <SendPitchRequestModal
          investorId={editing.investorId}
          investorName={nameOf(editing)}
          existing={editing.pitchRequest}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setSelected(null);
            setReloadKey((k) => k + 1); // old request is gone; load the replacement
          }}
        />
      )}

      {infoDialog && <InfoRequestDialog requestId={infoDialog.id} requestType={infoDialog.type} mode={infoDialog.mode} onClose={() => setInfoDialog(null)} />}

      {selected && (
        <RequestDetailsModal
          title={`${nameOf(selected)} → ${selected.pitchTitle}`}
          subtitle={`${direction === "sent" ? "Sent" : "Received"} ${formatRelativeTime(selected.createdAt)}`}
          badge={<StatusBadge status={selected.status} />}
          sections={
            selected.kind === "collaboration"
              ? [
                  { label: "Proposed amount", value: selected.amount },
                  { label: "Participation", value: selected.terms },
                  { label: "Target opportunity", value: selected.targetOpportunity },
                  { label: direction === "sent" ? "Your message" : "Investor's message", value: selected.message },
                  ...(selected.documentUrl ? [{ label: "Attached document", href: selected.documentUrl, hrefLabel: "Open document" }] : []),
                ]
              : [
                  { label: "Proposed investment", value: selected.amount },
                  { label: "Suggested terms", value: selected.terms },
                  { label: "Investor's message", value: selected.message },
                  { label: "Pitch", value: [selected.pitchTitle, selected.pitchSector, selected.pitchStage].filter(Boolean).join(" • ") },
                  { label: "Pitch target", value: selected.pitchTargetAmount },
                ]
          }
          actions={actionButtons(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}