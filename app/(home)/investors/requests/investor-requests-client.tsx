"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Ban,
  Flag,
  MessageSquare,
  Check,
  X,
  ArrowRight,
  Loader2,
  ChevronDown,
  Building2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/AuthStore";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ViewPitchModal, {
  type PitchRequestData,
  formatPitchFunding,
  formatPitchEquity,
} from "@/components/modals/view-pitch-modal";
import ReportCompanyModal from "@/components/modals/report-company-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PitchRequestItem extends PitchRequestData {
  sender?: {
    id: string;
    name: string | null;
    image: string | null;
    verificationStatus?: string;
    company?: {
      id?: string;
      companyName: string | null;
      logoUrl: string | null;
      type: string | null;
      location: string | null;
      description?: string | null;
    } | null;
  } | null;
}

type FilterTab = "PENDING" | "ACCEPTED" | "REVIEWED" | "ALL";
type SortOption = "NEWEST" | "OLDEST" | "HIGH_FUNDING" | "LOW_FUNDING";

function formatReceivedTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) {
    return diffMins <= 1 ? "Just now" : `${diffMins} hours ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseAmountValue(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^0-9.]/g, "");
  const num = parseFloat(clean) || 0;
  if (/cr|crore/i.test(str)) return num * 10000000;
  if (/l|lac|lakh/i.test(str)) return num * 100000;
  if (/m/i.test(str)) return num * 1000000;
  if (/k/i.test(str)) return num * 1000;
  return num;
}

export default function InvestorRequestsClient() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const [requests, setRequests] = useState<PitchRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("PENDING");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
  const [selectedPitch, setSelectedPitch] = useState<PitchRequestItem | null>(null);
  const [reportTarget, setReportTarget] = useState<{ userId: string; name: string; pitchRequestId?: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/pitch-requests");
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          // Filter to requests sent to this investor
          const relevant = user?.id
            ? json.data.filter((r: any) => r.investorId === user.id)
            : json.data;
          setRequests(relevant);
        }
      } catch (err) {
        console.error("Failed to load investment requests:", err);
        toast.error("Could not load investment requests.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRequests();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Compute stat counts
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const accepted = requests.filter((r) => r.status === "ACCEPTED").length;
    const reviewed = requests.filter((r) => r.status === "REVIEWED").length;
    return { pending, accepted, reviewed };
  }, [requests]);

  // Filter & sort
  const filteredRequests = useMemo(() => {
    const list = requests.filter((r) => {
      if (activeTab === "PENDING") return r.status === "PENDING";
      if (activeTab === "ACCEPTED") return r.status === "ACCEPTED";
      if (activeTab === "REVIEWED") return r.status === "REVIEWED";
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "OLDEST") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "HIGH_FUNDING") {
        return parseAmountValue(b.fundingRequirement) - parseAmountValue(a.fundingRequirement);
      }
      if (sortBy === "LOW_FUNDING") {
        return parseAmountValue(a.fundingRequirement) - parseAmountValue(b.fundingRequirement);
      }
      return 0;
    });
  }, [requests, activeTab, sortBy]);

  const handleUpdateStatus = async (id: string, newStatus: "ACCEPTED" | "DECLINED" | "REVIEWED") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/pitch-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        toast.success(
          newStatus === "ACCEPTED"
            ? "Request accepted!"
            : newStatus === "DECLINED"
            ? "Request declined."
            : "Follow-up initiated."
        );
        if (newStatus === "REVIEWED") {
          const reqItem = requests.find((r) => r.id === id);
          if (reqItem?.senderId) {
            router.push(`/messages/${reqItem.senderId}`);
          }
        }
      } else {
        toast.error(data.message || "Failed to update status.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/pitch-requests?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        toast.success("Request deleted successfully.");
      } else {
        toast.error(data.message || "Failed to delete request.");
      }
    } catch {
      toast.error("An error occurred while deleting.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlock = async (id: string, senderId: string, companyName: string) => {
    setProcessingId(id);
    try {
      // 1. Hide the company
      await fetch(`/api/company/${senderId}/hide`, { method: "POST" });
      // 2. Decline the pitch request
      await fetch("/api/pitch-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DECLINED" }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Blocked requests from ${companyName}.`);
    } catch {
      toast.error("Failed to block request.");
    } finally {
      setProcessingId(null);
    }
  };

  const sortLabel = () => {
    switch (sortBy) {
      case "NEWEST":
        return "Recently received";
      case "OLDEST":
        return "Oldest first";
      case "HIGH_FUNDING":
        return "Highest seeking amount";
      case "LOW_FUNDING":
        return "Lowest seeking amount";
      default:
        return "Recently received";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 3 STATS CARDS ABOVE (No upper headings as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Awaiting review */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-gray-500">Awaiting review</span>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.pending}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Needs your decision</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
        </div>

        {/* Card 2: Accepted */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-gray-500">Accepted</span>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.accepted}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Ready to connect</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Card 3: More information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-gray-500">More information</span>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">
              {stats.reviewed}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Follow-up started</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
        </div>
      </div>

      {/* Request filters and sorting */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === "PENDING"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Pending
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "PENDING" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {stats.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ACCEPTED")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === "ACCEPTED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Accepted
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "ACCEPTED" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {stats.accepted}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("REVIEWED")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === "REVIEWED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Info requested
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "REVIEWED" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {stats.reviewed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              All requests
            </button>
          </div>

          {/* Recently received sort dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
                >
                  <span>{sortLabel()}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 p-1 rounded-xl shadow-lg">
                <DropdownMenuItem
                  onSelect={() => setSortBy("NEWEST")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    sortBy === "NEWEST" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Recently received
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSortBy("OLDEST")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    sortBy === "OLDEST" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Oldest first
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSortBy("HIGH_FUNDING")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    sortBy === "HIGH_FUNDING" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Highest seeking amount
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSortBy("LOW_FUNDING")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    sortBy === "LOW_FUNDING" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Lowest seeking amount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* REQUESTS LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-gray-200 bg-white p-6 animate-pulse" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 space-y-3">
          <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="text-base font-bold text-gray-800">
            {activeTab === "PENDING"
              ? "No pending investment requests"
              : activeTab === "ACCEPTED"
              ? "No accepted investment requests"
              : activeTab === "REVIEWED"
              ? "No info-requested requests"
              : "No investment requests found"}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            When startups and businesses send you pitch requests, they will appear here for your review and evaluation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const avatarUrl = req.sender?.company?.logoUrl || req.sender?.image;
            const founderName = req.sender?.name || "Founder";
            const companyType = req.sender?.company?.type || "Startup";
            const isProcessing = processingId === req.id;

            const statusBadge = () => {
              switch (req.status) {
                case "ACCEPTED":
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      Accepted
                    </span>
                  );
                case "REVIEWED":
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                      Info requested
                    </span>
                  );
                case "DECLINED":
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200">
                      Declined
                    </span>
                  );
                default:
                  return (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      Pending review
                    </span>
                  );
              }
            };

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 hover:border-gray-300 transition"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      href={`/profile/${req.senderId}`}
                      className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden text-blue-700 font-bold text-base hover:opacity-90 transition"
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={req.companyName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{req.companyName.charAt(0).toUpperCase()}</span>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/profile/${req.senderId}`}
                          className="text-base font-bold text-gray-900 truncate hover:text-blue-600 hover:underline"
                        >
                          {req.companyName}
                        </Link>
                        <VerificationBadge
                          status={req.sender?.verificationStatus || "UNVERIFIED"}
                          size="xs"
                        />
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {founderName} &bull; Co-founder & CEO
                      </p>
                    </div>
                  </div>

                  {/* Status badge + Three dots menu (hides on outside click automatically via Radix UI) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge()}

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
                          onSelect={() => handleDelete(req.id)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={14} className="text-red-500" />
                          <span>Delete request</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleBlock(req.id, req.senderId, req.companyName)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <Ban size={14} className="text-gray-500" />
                          <span>Block request</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setReportTarget({
                              userId: req.senderId,
                              name: req.companyName,
                              pitchRequestId: req.id,
                            })
                          }
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <Flag size={14} className="text-gray-500" />
                          <span>Report</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Pitch headline & summary */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {req.problemStatement.slice(0, 75).trim()}
                      {req.problemStatement.length > 75 ? "..." : ""}
                    </h4>
                    {companyType && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {companyType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {req.proposedSolution || req.problemStatement}
                  </p>
                </div>

                {/* 4 Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Funding Stage
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-gray-800">
                      Seed
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Seeking
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-gray-900">
                      {formatPitchFunding(req.fundingRequirement)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Equity Offered
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-gray-900">
                      {formatPitchEquity(req.equityOffered)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Received
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-gray-600">
                      {formatReceivedTime(req.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card footer: View pitch details link on left, action buttons on right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedPitch(req)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <span>View pitch details</span>
                    <ArrowRight size={13} />
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {req.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(req.id, "DECLINED")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          <X size={13} className="text-red-500" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(req.id, "REVIEWED")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          <MessageSquare size={13} />
                          <span>Ask for info</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          {isProcessing ? (
                            <Loader2 size={13} className="animate-spin text-emerald-600" />
                          ) : (
                            <Check size={13} strokeWidth={2.5} className="text-emerald-500" />
                          )}
                          <span>Accept</span>
                        </button>
                      </>
                    )}

                    {req.status === "ACCEPTED" && (
                      <Link
                        href={`/messages/${req.senderId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-2xs"
                      >
                        <MessageSquare size={13} />
                        <span>Message Founder</span>
                      </Link>
                    )}

                    {req.status === "REVIEWED" && (
                      <Link
                        href={`/messages/${req.senderId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition shadow-2xs"
                      >
                        <MessageSquare size={13} />
                        <span>Continue Conversation</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Pitch Modal */}
      {selectedPitch && (
        <ViewPitchModal
          pitch={selectedPitch}
          onClose={() => setSelectedPitch(null)}
          onStatusChange={(newStatus) => {
            setSelectedPitch((prev) => (prev ? { ...prev, status: newStatus } : null));
            setRequests((prev) =>
              prev.map((r) => (r.id === selectedPitch.id ? { ...r, status: newStatus } : r))
            );
          }}
        />
      )}

      {/* Report Company Modal */}
      {reportTarget && (
        <ReportCompanyModal
          companyUserId={reportTarget.userId}
          companyName={reportTarget.name}
          pitchRequestId={reportTarget.pitchRequestId}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
