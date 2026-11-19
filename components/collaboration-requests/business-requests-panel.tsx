"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Ban,
  Flag,
  MessageSquare,
  Check,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ReportCompanyModal from "@/components/modals/report-company-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RequestsBoard from "./requests-board";
import RequestDetailsModal from "./request-details-modal";
import StatusBadge from "./status-badge";
import { formatRelativeTime } from "./utils";
import InfoRequestDialog from "@/components/info-requests/info-request-dialog";
import InfoRequestAction from "@/components/info-requests/info-request-action";
export interface B2BRequest {
  id: string;
  requesterId: string;
  recipientId?: string;
  expectations: string[];
  offerings: string[];
  contributionDesc: string | null;
  resourcesAvailable: string | null;
  expertiseCapabilities: string | null;
  existingAssets: string | null;
  overview: string;
  status: string; // PENDING | ACCEPTED | DECLINED | INFO_REQUESTED
  isConnected?: boolean;
  createdAt: string;
  requester?: {
    id: string;
    name: string | null;
    image: string | null;
    verificationStatus?: string;
    company?: {
      companyName: string | null;
      logoUrl: string | null;
      type: string | null;
      location: string | null;
    } | null;
  } | null;
  recipient?: {
    id: string;
    name: string | null;
    image: string | null;
    verificationStatus?: string;
    company?: {
      companyName: string | null;
      logoUrl: string | null;
      type: string | null;
      location: string | null;
    } | null;
  } | null;
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

interface BusinessRequestsPanelProps {
  onPendingCountChange?: (count: number) => void;
}

export default function BusinessRequestsPanel({ onPendingCountChange }: BusinessRequestsPanelProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<B2BRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("PENDING");
  const [sortBy, setSortBy] = useState<SortKey>("NEWEST");
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<B2BRequest | null>(null);
  const [reportTarget, setReportTarget] = useState<{ userId: string; name: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ id: string; mode: "ask" | "answer" | "view" } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/marketplace/collaborate?direction=${direction}&counterparty=business`);
        const json = res.ok ? await res.json() : null;
        if (active && json?.success && Array.isArray(json.data)) {
          setRequests(json.data);
        } else if (!res.ok) {
          console.warn(`B2B collaboration requests endpoint returned ${res.status}`);
        }
      } catch (err) {
        console.error("Failed to load business collaboration requests:", err);
        if (active) toast.error("Could not load business collaboration requests.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [direction]);

  const stats = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "PENDING").length,
      accepted: requests.filter((r) => r.status === "ACCEPTED").length,
      info: requests.filter((r) => r.status === "INFO_REQUESTED").length,
      declined: requests.filter((r) => r.status === "DECLINED" || r.status === "REJECTED").length,
    }),
    [requests]
  );

  useEffect(() => {
    onPendingCountChange?.(stats.pending);
  }, [stats.pending, onPendingCountChange]);

  const partnerOf = (req: B2BRequest) => (direction === "sent" ? req.recipient : req.requester);
  const partnerIdOf = (req: B2BRequest) =>
    direction === "sent" ? req.recipientId || req.recipient?.id || "" : req.requesterId;
  const nameOf = (req: B2BRequest) => {
    const p = partnerOf(req);
    return p?.company?.companyName || p?.name || "Business";
  };

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = requests.filter((r) => {
      if (activeFilter === "DECLINED") {
        if (r.status !== "DECLINED" && r.status !== "REJECTED") return false;
      } else if (activeFilter !== "ALL" && r.status !== activeFilter) {
        return false;
      }

      if (q) {
        const name = nameOf(r).toLowerCase();
        const overview = (r.overview || "").toLowerCase();
        const contribution = (r.contributionDesc || "").toLowerCase();
        const offerings = (r.offerings || []).join(" ").toLowerCase();
        const expectations = (r.expectations || []).join(" ").toLowerCase();
        const matchesQuery =
          name.includes(q) ||
          overview.includes(q) ||
          contribution.includes(q) ||
          offerings.includes(q) ||
          expectations.includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "HIGH_FUNDING":
          return (b.offerings?.length || 0) - (a.offerings?.length || 0);
        case "LOW_FUNDING":
          return (a.offerings?.length || 0) - (b.offerings?.length || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [requests, activeFilter, sortBy, searchQuery, direction]);

  const cancelProposal = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/marketplace/collaborate?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        toast.success("Collaboration proposal cancelled.");
      } else {
        toast.error(json.message || "Failed to cancel proposal.");
      }
    } catch {
      toast.error("Failed to cancel proposal.");
    } finally {
      setProcessingId(null);
    }
  };

  const updateStatus = async (id: string, status: "ACCEPTED" | "DECLINED" | "INFO_REQUESTED") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/marketplace/collaborate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
        toast.success(
          status === "ACCEPTED" ? "Request accepted!" : status === "DECLINED" ? "Request declined." : "Follow-up initiated."
        );
        if (status === "INFO_REQUESTED") {
          const item = requests.find((r) => r.id === id);
          if (item?.requesterId) router.push(`/messages/${item.requesterId}`);
        }
      } else {
        toast.error(data.message || "Failed to update request.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const blockBusiness = async (id: string, requesterId: string, name: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/company/${requesterId}/hide`, { method: "POST" });
      await fetch("/api/marketplace/collaborate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DECLINED" }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Blocked requests from ${name}.`);
    } catch {
      toast.error("Failed to block business.");
    } finally {
      setProcessingId(null);
    }
  };

  const actionButtons = (req: B2BRequest) => {
    const busy = processingId === req.id;
    const partnerId = partnerIdOf(req);

    if (direction === "sent") {
      if (req.status === "PENDING") {
        return (
          <button
            type="button"
            disabled={busy}
            onClick={() => cancelProposal(req.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {busy ? <Loader2 size={13} className="animate-spin text-red-500" /> : <X size={13} className="text-red-500" />}
            <span>Cancel Request</span>
          </button>
        );
      }
      if (req.status === "ACCEPTED") {
        return (
          <Link
            href={`/messages/${partnerId}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-2xs"
          >
            <MessageSquare size={13} />
            <span>Message Business</span>
          </Link>
        );
      }
      if (req.status === "INFO_REQUESTED") {
        return (
          <>
            <InfoRequestAction requestId={req.id} requestType="BUSINESS_COLLABORATION" />
            {req.isConnected && (
              <Link href={`/messages/${partnerId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition shadow-2xs"><MessageSquare size={13} /><span>Continue Conversation</span></Link>
            )}
          </>
        );
      }
      return null;
    }

    if (req.status === "PENDING") {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => updateStatus(req.id, "DECLINED")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <X size={13} className="text-red-500" />
            <span>Reject</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setInfoDialog({ id: req.id, mode: "ask" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <MessageSquare size={13} />
            <span>Ask for info</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => updateStatus(req.id, "ACCEPTED")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {busy ? <Loader2 size={13} className="animate-spin text-emerald-500" /> : <Check size={13} strokeWidth={2.5} className="text-emerald-500" />}
            <span>Accept</span>
          </button>
        </>
      );
    }
    if (req.status === "ACCEPTED") {
      return (
        <Link
          href={`/messages/${partnerId}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-2xs"
        >
          <MessageSquare size={13} />
          <span>Message Business</span>
        </Link>
      );
    }
    if (req.status === "INFO_REQUESTED") {
      return (
        <>
          <InfoRequestAction requestId={req.id} requestType="BUSINESS_COLLABORATION" />
          <button
            type="button"
            disabled={busy}
            onClick={() => updateStatus(req.id, "DECLINED")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <X size={13} className="text-red-500" />
            <span>Reject</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => updateStatus(req.id, "ACCEPTED")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {busy ? <Loader2 size={13} className="animate-spin text-emerald-500" /> : <Check size={13} strokeWidth={2.5} className="text-emerald-500" />}
            <span>Accept</span>
          </button>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <RequestsBoard
        stats={[
          { label: "Awaiting review", value: stats.pending, caption: "Needs your decision", icon: <Clock size={18} />, tone: "emerald" },
          { label: "Accepted", value: stats.accepted, caption: "Ready to collaborate", icon: <CheckCircle2 size={18} />, tone: "emerald" },
          { label: "More information", value: stats.info, caption: "Follow-up started", icon: <AlertCircle size={18} />, tone: "amber" },
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
        searchPlaceholder="Search collaboration requests..."
        loading={loading}
        isEmpty={visible.length === 0}
        emptyTitle={
          searchQuery
            ? `No requests found matching "${searchQuery}"`
            : direction === "sent"
            ? "No sent collaboration requests"
            : activeFilter === "PENDING"
            ? "No pending collaboration requests"
            : activeFilter === "ACCEPTED"
            ? "No accepted collaboration requests"
            : activeFilter === "INFO_REQUESTED"
            ? "No info-requested collaboration requests"
            : activeFilter === "DECLINED"
            ? "No rejected collaboration requests"
            : "No collaboration requests found"
        }
        emptyDescription={
          searchQuery
            ? "Try searching with different keywords or clearing your search."
            : direction === "sent"
            ? "You have not sent any collaboration proposals to other businesses yet."
            : "When other businesses send you a B2B collaboration proposal, it will appear here for your review."
        }
      >
        {visible.map((req) => {
          const partner = partnerOf(req);
          const partnerId = partnerIdOf(req);
          const name = nameOf(req);
          const avatar = partner?.company?.logoUrl || partner?.image;
          const ownerName = partner?.name || "Business";
          const companyType = partner?.company?.type;
          const location = partner?.company?.location;

          return (
            <div
              key={req.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 hover:border-gray-300 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/profile/${partnerId}`}
                    className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden text-blue-700 font-bold text-base hover:opacity-90 transition"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{name.charAt(0).toUpperCase()}</span>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/profile/${partnerId}`}
                        className="text-base font-bold text-gray-900 truncate hover:text-blue-600 hover:underline"
                      >
                        {name}
                      </Link>
                      <VerificationBadge status={partner?.verificationStatus || "UNVERIFIED"} size="xs" />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {ownerName}
                      {companyType ? ` • ${companyType}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={req.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer outline-none"
                        aria-label="More actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-200 p-1 rounded-xl shadow-lg">
                      <DropdownMenuItem
                        onSelect={() => blockBusiness(req.id, partnerId, name)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <Ban size={14} className="text-gray-500" />
                        <span>Block business</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setReportTarget({ userId: partnerId, name })}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <Flag size={14} className="text-gray-500" />
                        <span>Report</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-900 leading-snug">Proposes a business collaboration</p>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{req.overview}</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {req.expectations.slice(0, 4).map((e) => (
                    <span key={`e-${e}`} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      Wants: {e}
                    </span>
                  ))}
                  {req.offerings.slice(0, 4).map((o) => (
                    <span key={`o-${o}`} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Offers: {o}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Business type</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-800">{companyType || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{location || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Offerings</span>
                  <span className="mt-0.5 block text-xs font-bold text-gray-900">{req.offerings.length}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Received</span>
                  <span className="mt-0.5 block text-xs font-medium text-gray-600">{formatRelativeTime(req.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelected(req)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  <span>View proposal details</span>
                  <ArrowRight size={13} />
                </button>
                <div className="flex items-center gap-2 self-end sm:self-auto">{actionButtons(req)}</div>
              </div>
            </div>
          );
        })}
      </RequestsBoard>

      {selected && (
        <RequestDetailsModal
          title={nameOf(selected)}
          subtitle={`Received ${formatRelativeTime(selected.createdAt)}`}
          badge={<StatusBadge status={selected.status} />}
          sections={[
            { label: "Collaboration overview", value: selected.overview },
            { label: "What they expect", chips: selected.expectations },
            { label: "What they offer", chips: selected.offerings },
            { label: "Their contribution", value: selected.contributionDesc },
            { label: "Resources available", value: selected.resourcesAvailable },
            { label: "Expertise & capabilities", value: selected.expertiseCapabilities },
            { label: "Existing assets", value: selected.existingAssets },
          ]}
          actions={actionButtons(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {infoDialog && <InfoRequestDialog requestId={infoDialog.id} requestType="BUSINESS_COLLABORATION" mode={infoDialog.mode} onClose={() => setInfoDialog(null)} />}

      {reportTarget && (
        <ReportCompanyModal
          companyUserId={reportTarget.userId}
          companyName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}
    </>
  );
}