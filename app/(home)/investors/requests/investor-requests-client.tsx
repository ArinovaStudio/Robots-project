"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Search,
  ArrowLeftRight,
  Landmark,
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
import InfoRequestDialog from "@/components/info-requests/info-request-dialog";
import InfoRequestAction from "@/components/info-requests/info-request-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PitchRequestItem extends PitchRequestData {
  investorId?: string;
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

type FilterTab = "PENDING" | "ACCEPTED" | "REVIEWED" | "DECLINED" | "ALL" |"Ask more info";
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
  const user = useUserStore((s) => s.user);
  const searchParams = useSearchParams();
  const collaborationId = searchParams.get("collaborationId");
  // Notification links carry ?collaborationId=..., so open the Investor tab for them.
  const [division, setDivision] = useState<"business" | "investor">(collaborationId ? "investor" : "business");
  const [infoDialog, setInfoDialog] = useState<{ id: string; type: "PITCH_REQUEST" | "INVESTOR_COLLABORATION"; mode: "ask" | "answer" | "view" } | null>(null);
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<PitchRequestItem[]>([]);
  const [investorOffers, setInvestorOffers] = useState<any[]>([]);
  const [collabSent, setCollabSent] = useState<any[]>([]);
  const [collabReceived, setCollabReceived] = useState<any[]>([]);
  const [expandedCollabId, setExpandedCollabId] = useState<string | null>(null);
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
        const [pitchRes, myPitchesRes, collabRes] = await Promise.all([
          fetch("/api/pitch-requests"),
          fetch("/api/investor/my-pitches").catch(() => null),
          fetch("/api/investor/collaborations").catch(() => null),
        ]);
        const json = await pitchRes.json();
        if (active && json.success && Array.isArray(json.data)) {
          setRequests(json.data);
        }
        if (myPitchesRes && myPitchesRes.ok) {
          const myPitchesJson = await myPitchesRes.json();
          if (active && myPitchesJson.success && Array.isArray(myPitchesJson.data?.offers)) {
            setInvestorOffers(myPitchesJson.data.offers);
          }
        }
        if (collabRes && collabRes.ok) {
          const collabJson = await collabRes.json();
          if (active && collabJson.success) {
            setCollabSent(Array.isArray(collabJson.data?.sent) ? collabJson.data.sent : []);
            setCollabReceived(Array.isArray(collabJson.data?.received) ? collabJson.data.received : []);
          }
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

  const businessPending = useMemo(
    () => requests.filter((r) => r.investorId === user?.id && r.status === "PENDING").length,
    [requests, user?.id]
  );
  const investorPending = useMemo(
    () => collabReceived.filter((c) => c.status === "PENDING").length,
    [collabReceived]
  );

  const tabs: { key: "business" | "investor"; label: string; icon: typeof ArrowLeftRight; pending: number }[] = [
    { key: "business", label: "Business", icon: ArrowLeftRight, pending: businessPending },
    { key: "investor", label: "Investor", icon: Landmark, pending: investorPending },
  ];

  // Maps an investor collaboration row to the card shape; `other` is the counterparty.
  const mapCollab = (c: any, other: any): PitchRequestItem & { kind: "collaboration" } => {
    const firm = other?.investor?.firmName || other?.name || "Investor";
    return {
      kind: "collaboration",
      id: c.id,
      senderId: other?.id || "",
      investorId: user?.id || "",
      companyName: firm,
      problemStatement: `${c.collaborationType} collaboration on ${c.targetCompany}`,
      proposedSolution: c.participation || "",
      fundingRequirement: c.proposedAmount || "",
      equityOffered: null,
      message: c.message || "",
      pitchDeckUrl: c.pitchDeckUrl || "",
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      sender: {
        id: other?.id || "",
        name: other?.name || null,
        image: other?.image || null,
        verificationStatus: other?.verificationStatus,
        company: {
          companyName: firm,
          logoUrl: other?.image || null,
          type: other?.investor?.investorType || "Investor",
          location: [other?.investor?.city, other?.investor?.country].filter(Boolean).join(", ") || null,
        },
      },
      // extra details shown in the expanded view
      ...({ collab: c } as object),
    } as PitchRequestItem & { kind: "collaboration" };
  };

  // Active requests depending on division (Business vs Investor) & direction (received vs sent)
  const activeRequests = useMemo(() => {
    if (division === "business") {
      if (direction === "received") {
        return user?.id ? requests.filter((r) => r.investorId === user.id) : requests;
      }
      return user?.id ? requests.filter((r) => r.senderId === user.id) : [];
    }
    // Investor division
    if (direction === "received") {
      return collabReceived.map((c) => mapCollab(c, c.requester));
    }
    if (direction === "sent") {
      const collabs = collabSent.map((c) => mapCollab(c, c.collaborator));
      const offers = investorOffers.map((o) => ({
        id: o.id,
        senderId: o.founderId || "",
        investorId: user?.id || "",
        companyName: o.companyName || o.pitchTitle || "Company",
        problemStatement: o.pitchTitle ? `Investment offer on "${o.pitchTitle}"` : "Investment offer",
        proposedSolution: o.terms || o.message || "Terms not specified",
        fundingRequirement: o.amount || "$0",
        equityOffered: o.terms || null,
        message: o.message || "",
        pitchDeckUrl: "",
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
        sender: {
          id: o.founderId || "",
          name: o.founderName || "Founder",
          image: null,
          verificationStatus: "VERIFIED",
          company: {
            companyName: o.companyName || null,
            logoUrl: o.logoUrl || null,
            type: o.pitchType || o.stage || "Startup",
            location: o.location || null,
          },
        },
      })) as PitchRequestItem[];
      return [...collabs, ...offers];
    }
    return [];
  }, [division, direction, requests, investorOffers, collabSent, collabReceived, user?.id]);

  // Compute stat counts
  const stats = useMemo(() => {
    const pending = activeRequests.filter((r) => r.status === "PENDING").length;
    const accepted = activeRequests.filter((r) => r.status === "ACCEPTED").length;
    const reviewed = activeRequests.filter((r) => r.status === "REVIEWED").length;
    const declined = activeRequests.filter((r) => r.status === "DECLINED" || r.status === "REJECTED").length;
    return { pending, accepted, reviewed, declined };
  }, [activeRequests]);

  // Filter & sort
  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = activeRequests.filter((r) => {
      if (activeTab === "PENDING" && r.status !== "PENDING") return false;
      if (activeTab === "ACCEPTED" && r.status !== "ACCEPTED") return false;
      if (activeTab === "REVIEWED" && r.status !== "REVIEWED") return false;
      if (activeTab === "DECLINED" && r.status !== "DECLINED" && r.status !== "REJECTED") return false;

      if (q) {
        const founder = (r.sender?.name || "").toLowerCase();
        const company = (r.sender?.company?.companyName || r.companyName || "").toLowerCase();
        const problem = (r.problemStatement || "").toLowerCase();
        const solution = (r.proposedSolution || "").toLowerCase();
        const message = (r.message || "").toLowerCase();
        const matchesQuery =
          founder.includes(q) ||
          company.includes(q) ||
          problem.includes(q) ||
          solution.includes(q) ||
          message.includes(q);
        if (!matchesQuery) return false;
      }

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
  }, [activeRequests, activeTab, sortBy, searchQuery]);

  const handleUpdateStatus = async (id: string, newStatus: "ACCEPTED" | "DECLINED" | "REVIEWED") => {
    setProcessingId(id);
    const isCollab = collabReceived.some((c) => c.id === id);
    try {
      const res = await fetch(isCollab ? "/api/investor/collaborations" : "/api/pitch-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (isCollab) {
          setCollabReceived((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
        } else {
          setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
          );
        }
        toast.success(
          newStatus === "ACCEPTED"
            ? "Request accepted!"
            : newStatus === "DECLINED"
            ? "Request declined."
            : "Follow-up initiated."
        );
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
    const isCollab = collabSent.some((c) => c.id === id) || collabReceived.some((c) => c.id === id);
    try {
      const res = await fetch(
        isCollab ? `/api/investor/collaborations?id=${id}` : `/api/pitch-requests?id=${id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (isCollab) {
          setCollabSent((prev) => prev.filter((c) => c.id !== id));
          setCollabReceived((prev) => prev.filter((c) => c.id !== id));
        } else {
          setRequests((prev) => prev.filter((r) => r.id !== id));
        }
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
        return direction === "sent" ? "Recently sent" : "Recently received";
      case "OLDEST":
        return "Oldest first";
      case "HIGH_FUNDING":
        return "Highest seeking amount";
      case "LOW_FUNDING":
        return "Lowest seeking amount";
      default:
        return direction === "sent" ? "Recently sent" : "Recently received";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Navigation: Business / Investor */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-xs flex items-center" role="tablist">
        {tabs.map(({ key, label, icon: Icon, pending }) => {
          const active = division === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDivision(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                active ? "bg-blue-50 text-blue-700 shadow-xs" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {pending > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

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
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Left side: search */}
          <div className="min-w-0 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search investment requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 lg:w-96 pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Right side: status + sort + direction */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto shrink-0">
            {/* Status filter dropdown */}
            {(() => {
              const filterOptions: { key: FilterTab; label: string }[] = [
                { key: "PENDING", label: "Pending" },
                { key: "ACCEPTED", label: "Accepted" },
                { key: "REVIEWED", label: "Ask info" },
                { key: "DECLINED", label: "Rejected" },
                { key: "ALL", label: "All requests" },
              ];
              const activeOption = filterOptions.find((f) => f.key === activeTab) ?? filterOptions[0];
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                    >
                      <span>{activeOption.label}</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-white border border-gray-200 p-1 rounded-xl shadow-lg">
                    {filterOptions.map((f) => (
                      <DropdownMenuItem
                        key={f.key}
                        onSelect={() => setActiveTab(f.key)}
                        className={`flex items-center justify-between px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                          activeTab === f.key ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                        }`}
                      >
                        <span>{f.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}

            {/* Adjacent Left: Sort dropdown */}
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
                  {direction === "sent" ? "Recently sent" : "Recently received"}
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

            {/* Most Right: Direction dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
                >
                  <span>{direction === "sent" ? "Request sent" : "Request received"}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-200 p-1 rounded-xl shadow-lg">
                <DropdownMenuItem
                  onSelect={() => setDirection("received")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    direction !== "sent" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Request received
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDirection("sent")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    direction === "sent" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Request sent
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Search size={22} strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchQuery
              ? `No requests found matching "${searchQuery}"`
              : direction === "sent"
              ? division === "business"
                ? "No sent pitch requests"
                : "No sent investment offers"
              : activeTab === "PENDING"
              ? "No pending investment requests"
              : activeTab === "ACCEPTED"
              ? "No accepted investment requests"
              : activeTab === "REVIEWED"
              ? "No info-requested requests"
              : activeTab === "DECLINED"
              ? "No rejected investment requests"
              : "No investment requests found"}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? "Try searching with a different keyword, company name, or clearing your search."
              : direction === "sent"
              ? "When you send pitch requests or investment offers, they will appear here."
              : division === "investor"
              ? "When other investors send you collaboration requests, they will appear here for your review."
              : "When startups and businesses send you pitch requests, they will appear here for your review and evaluation."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs mt-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const avatarUrl = req.sender?.company?.logoUrl || req.sender?.image;
            const founderName = req.sender?.name || "Founder";
            const companyType = req.sender?.company?.type || "Startup";
            const isProcessing = processingId === req.id;
            const collab = (req as any).kind === "collaboration" ? (req as any).collab : null;

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
                      Ask info
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
                        {collab ? `${founderName} • Investor` : `${founderName} • Co-founder & CEO`}
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
                        {!collab && (
                        <DropdownMenuItem
                          onSelect={() => handleBlock(req.id, req.senderId, req.companyName)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <Ban size={14} className="text-gray-500" />
                          <span>Block request</span>
                        </DropdownMenuItem>
                        )}
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
                      {collab ? "Deal Stage" : "Funding Stage"}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-gray-800">
                      {collab ? collab.dealStage : "Seed"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {collab ? "Proposed Amount" : "Seeking"}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-gray-900">
                      {formatPitchFunding(req.fundingRequirement)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {collab ? "Type" : "Equity Offered"}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-gray-900">
                      {collab ? collab.collaborationType : formatPitchEquity(req.equityOffered)}
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

                {collab && expandedCollabId === req.id && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-xs text-gray-700 space-y-2">
                    <p><span className="font-semibold">Target company:</span> {collab.targetCompany}</p>
                    <p><span className="font-semibold">Participation:</span> {collab.participation}</p>
                    <p className="whitespace-pre-wrap"><span className="font-semibold">Message:</span> {collab.message}</p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {([
                        ["Pitch deck", collab.pitchDeckUrl],
                        ["Business plan", collab.businessPlanUrl],
                        ["Financials", collab.financialsUrl],
                        ["Other documents", collab.otherDocumentsUrl],
                      ] as [string, string | null][]).filter(([, url]) => url).map(([label, url]) => (
                        <a key={label} href={url as string} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card footer: View pitch details link on left, action buttons on right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() =>
                      collab
                        ? setExpandedCollabId((prev) => (prev === req.id ? null : req.id))
                        : setSelectedPitch(req)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <span>{collab ? (expandedCollabId === req.id ? "Hide details" : "View details") : "View pitch details"}</span>
                    <ArrowRight size={13} />
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {req.status === "PENDING" && (
                      direction === "sent" ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDelete(req.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          <X size={13} className="text-red-500" />
                          <span>Cancel Request</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(req.id, "DECLINED")}
                            className="inline-flex items-center gap-1.5 rounded-lg border  bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                          >
                            <X size={13} className="text-red-500" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setInfoDialog({ id: req.id, type: collab ? "INVESTOR_COLLABORATION" : "PITCH_REQUEST", mode: "ask" })}
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
                      )
                    )}

                    {req.status === "ACCEPTED" && (
                      <Link
                        href={`/messages/${req.senderId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-2xs"
                      >
                        <MessageSquare size={13} />
                        <span>{collab ? "Message Investor" : "Message Founder"}</span>
                      </Link>
                    )}

                    {req.status === "REVIEWED" && (
                      <InfoRequestAction requestId={req.id} requestType={collab ? "INVESTOR_COLLABORATION" : "PITCH_REQUEST"} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {infoDialog && <InfoRequestDialog requestId={infoDialog.id} requestType={infoDialog.type} mode={infoDialog.mode} onClose={() => setInfoDialog(null)} />}

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