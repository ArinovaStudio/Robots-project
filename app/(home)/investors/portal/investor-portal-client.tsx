"use client";

import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Target,
  Search,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  PlusCircle,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  Send,
  Loader2,
  Link as LinkIcon,
  Star,
  MessageSquare,
  X,
  FileText,
  MoreVertical,
  Handshake,
  UserCheck,
  UserMinus,
  UserPlus,
  Trash2,
  Ban,
  Flag,
  MessageCircle,
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import ConnectModal from "@/components/modals/connect-modal";
import MakeOfferModal from "@/components/modals/make-offer-modal";
import RatePitchModal from "@/components/modals/rate-pitch-modal";
import CollaborateModal from "@/components/modals/collaborate-modal";
import ReportCompanyModal from "@/components/modals/report-company-modal";
import ConfirmModal from "@/components/modals/confirm-modal";
import VerificationBadge from "@/components/ui/VerificationBadge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatTargetAmount } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PitchItem {
  id: string;
  userId: string;
  title: string;
  tagline: string | null;
  type: "PITCH" | "PRODUCT" | "IDEA";
  summary: string;
  sector: string;
  stage: string;
  targetAmount: string | null;
  equityOffered: string | null;
  highlights: string[];
  pitchDeckUrl: string | null;
  websiteUrl: string | null;
  createdAt: string;
  company: {
    companyName: string;
    logoUrl: string | null;
    type: string;
    location: string | null;
    size: number | null;
    founderName: string | null;
    isVerified: boolean;
  };
  connectionStatus: string | null;
  connectionId?: string | null;
  isConnectionSender?: boolean;
  userRating?: number | null;
  userFeedback?: string | null;
  isRated?: boolean;
  averageRating?: number;
  ratingCount?: number;
  views?: number;
  connections?: number;
}

interface PreferenceCompany {
  id: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  type: string;
  dealIn: string[];
  lookingFor: string[];
  size: number | null;
  yearOfEstablishment: number | null;
  location: string | null;
  description: string;
  isBoosted: boolean;
  isVerified: boolean;
  stats: {
    followers: number;
    connections: number;
    recentViews: number;
  };
  performanceScore: number;
  matchPercentage: number;
  badges: string[];
  connectionStatus: string | null;
  connectionId?: string | null;
  isConnectionSender?: boolean;
}

function formatDescription(value: string) {
  return value
    .trim()
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function BioText({
  title,
  bio,
  onViewDetails,
}: {
  title?: string;
  bio: string | null;
  onViewDetails?: () => void;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [bio, expanded]);

  return (
    <div className="rounded-lg bg-[#F1F5F9] px-3 py-2 text-xs leading-5 text-[#334155]">
      {title && <h4 className="font-bold text-[#172033] text-xs mb-0.5 line-clamp-1">{title}</h4>}
      <p ref={ref} className={`whitespace-pre-line break-words ${expanded ? "" : "line-clamp-2"}`}>
        {bio || "No summary provided."}
      </p>
      <div className="flex items-center gap-3 mt-1">
        {(overflowing || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="font-semibold text-[#2563EB] hover:underline"
          >
            View pitch details
          </button>
        )}
      </div>
    </div>
  );
}

const PITCH_CHUNK = 12;

export default function InvestorPortalClient({ view }: { view: "pitches" | "performers" }) {
  const [pitches, setPitches] = useState<PitchItem[]>([]);
  const [performers, setPerformers] = useState<PreferenceCompany[]>([]);
  const [selectedPitch, setSelectedPitch] = useState<PitchItem | null>(null);
  const [selectedPerformer, setSelectedPerformer] = useState<PreferenceCompany | null>(null);
  const [preferences, setPreferences] = useState<{ sectors: string[]; stages: string[]; investmentRange: string } | null>(null);

  const [loadingPitches, setLoadingPitches] = useState(true);
  // Progressive rendering: show pitches in chunks, load the next chunk on scroll
  const [renderCount, setRenderCount] = useState(PITCH_CHUNK);
  const pitchSentinelRef = useRef<HTMLDivElement | null>(null);
  const [loadingPerformers, setLoadingPerformers] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PITCH" | "PRODUCT" | "IDEA">("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyPreferences, setOnlyPreferences] = useState(false);

  // Modal & action states
  const [hiddenPitches, setHiddenPitches] = useState<Set<string>>(new Set());
  const [selectedConnectCompany, setSelectedConnectCompany] = useState<{ id: string; name: string } | null>(null);
  const [collaborationTarget, setCollaborationTarget] = useState<{ recipientId: string; companyName: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ userId: string; companyName: string } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "block" | "disconnect"; pitch: PitchItem } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null);
  const [offerTarget, setOfferTarget] = useState<{ pitchId: string; pitchTitle: string; companyName: string } | null>(null);
  const [rateTarget, setRateTarget] = useState<{
    pitchId: string;
    pitchTitle: string;
    currentRating?: number | null;
    currentFeedback?: string | null;
  } | null>(null);
  const [confirmCancelTarget, setConfirmCancelTarget] = useState<{
    userId: string;
    connectionId?: string | null;
    name: string;
  } | null>(null);

  const handleDeletePitch = async (pitch: PitchItem) => {
    setHiddenPitches((prev) => new Set(prev).add(pitch.id));
    try {
      const res = await fetch(`/api/company/${pitch.userId}/hide`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setHiddenPitches((prev) => {
          const next = new Set(prev);
          next.delete(pitch.id);
          return next;
        });
        toast.error(data.message || "Couldn't remove this company");
        return;
      }
      toast.success("Removed from your feed", {
        action: {
          label: "Undo",
          onClick: async () => {
            const u = await fetch(`/api/company/${pitch.userId}/hide`, { method: "DELETE" });
            const uData = await u.json().catch(() => ({}));
            if (u.ok && uData.success) {
              setHiddenPitches((prev) => {
                const next = new Set(prev);
                next.delete(pitch.id);
                return next;
              });
            } else {
              toast.error("Couldn't restore this company");
            }
          },
        },
      });
    } catch {
      setHiddenPitches((prev) => {
        const next = new Set(prev);
        next.delete(pitch.id);
        return next;
      });
      toast.error("Couldn't remove this company");
    }
  };

  const handleCancelPitchRequest = async (pitch: PitchItem) => {
    try {
      const res = await fetch("/api/network/connect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pitch.userId, connectionId: pitch.connectionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("Connection request cancelled");
        setPitches((prev) =>
          prev.map((p) =>
            p.userId === pitch.userId ? { ...p, connectionStatus: null, connectionId: null } : p
          )
        );
      } else {
        toast.error(data.message || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  const handleAcceptPitchRequest = async (pitch: PitchItem) => {
    try {
      if (!pitch.connectionId) {
        const res = await fetch("/api/network/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: pitch.userId }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          toast.success("Connected!");
          setPitches((prev) =>
            prev.map((p) =>
              p.userId === pitch.userId ? { ...p, connectionStatus: "ACCEPTED" } : p
            )
          );
        } else {
          toast.error(data.message || "Couldn't accept request");
        }
        return;
      }
      const res = await fetch("/api/network/connect/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: pitch.connectionId, action: "ACCEPT" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("Connected!");
        setPitches((prev) =>
          prev.map((p) =>
            p.userId === pitch.userId ? { ...p, connectionStatus: "ACCEPTED" } : p
          )
        );
      } else {
        toast.error(data.message || "Couldn't accept request");
      }
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    setConfirming(true);
    const { kind, pitch } = confirm;
    if (kind === "disconnect") {
      try {
        const res = await fetch("/api/network/connect", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: pitch.userId }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          setPitches((prev) =>
            prev.map((p) =>
              p.userId === pitch.userId ? { ...p, connectionStatus: null, connectionId: null } : p
            )
          );
          toast.success("Connection removed");
        } else {
          toast.error(data.message || "Couldn't remove the connection");
        }
      } catch {
        toast.error("Couldn't remove the connection");
      }
    } else {
      try {
        const res = await fetch(`/api/investor/${pitch.userId}/block`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setHiddenPitches((prev) => new Set(prev).add(pitch.id));
          toast.success("Company blocked", {
            action: {
              label: "Undo",
              onClick: async () => {
                const u = await fetch(`/api/investor/${pitch.userId}/block`, { method: "DELETE" });
                const uData = await u.json().catch(() => ({}));
                if (u.ok && uData.success) {
                  setHiddenPitches((prev) => {
                    const next = new Set(prev);
                    next.delete(pitch.id);
                    return next;
                  });
                } else {
                  toast.error("Couldn't unblock this company");
                }
              },
            },
          });
        } else {
          toast.error(data.message || "Couldn't block this company");
        }
      } catch {
        toast.error("Couldn't block this company");
      }
    }
    setConfirming(false);
    setConfirm(null);
  };

  const handleCancelConnection = async (targetUserId: string, connectionId?: string | null) => {
    setCancellingUserId(targetUserId);
    try {
      const res = await fetch("/api/network/connect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, connectionId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Connection request cancelled");
        setPitches((prev) =>
          prev.map((p) =>
            p.userId === targetUserId ? { ...p, connectionStatus: null, connectionId: null } : p
          )
        );
        setPerformers((prev) =>
          prev.map((c) =>
            c.userId === targetUserId ? { ...c, connectionStatus: null, connectionId: null } : c
          )
        );
      } else {
        toast.error(data.message || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setCancellingUserId(null);
    }
  };

  const recordPitchView = async (pitchId: string) => {
    try {
      await fetch(`/api/investor/pitches/${pitchId}/view`, { method: "POST" });
    } catch {
      // ignore
    }
  };

  // Fetch Pitches
  const fetchPitches = async () => {
    setLoadingPitches(true);
    try {
      const res = await fetch("/api/investor/pitches");
      const json = await res.json();
      if (json.success) {
        setPitches(json.data);
      }
    } catch {
      toast.error("Failed to load investment pitches");
    } finally {
      setLoadingPitches(false);
    }
  };

  // Fetch Companies Doing Good in Preferences
  const fetchPerformers = async () => {
    setLoadingPerformers(true);
    try {
      const res = await fetch("/api/investor/preference-matches");
      const json = await res.json();
      if (json.success) {
        setPerformers(json.data);
        setPreferences(json.preferences);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPerformers(false);
    }
  };

  useEffect(() => {
    if (view === "pitches") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPitches();
    } else {
      fetchPerformers();
    }
  }, [view]);

  const filteredPitches = useMemo(() => {
    return pitches.filter(p => {
      if (typeFilter !== "ALL" && p.type !== typeFilter) return false;
      if (stageFilter !== "ALL" && !p.stage.toLowerCase().includes(stageFilter.toLowerCase())) return false;
      if (sectorFilter !== "ALL" && !p.sector.toLowerCase().includes(sectorFilter.toLowerCase())) return false;
      if (onlyPreferences && preferences?.sectors?.length) {
        const matchesPref = preferences.sectors.some(s =>
          p.sector.toLowerCase().includes(s.toLowerCase()) ||
          p.company.type.toLowerCase().includes(s.toLowerCase())
        );
        if (!matchesPref) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inSummary = p.summary.toLowerCase().includes(q);
        const inCompany = p.company.companyName.toLowerCase().includes(q);
        const inSector = p.sector.toLowerCase().includes(q);
        if (!inTitle && !inSummary && !inCompany && !inSector) return false;
      }
      return true;
    });
  }, [pitches, typeFilter, stageFilter, sectorFilter, onlyPreferences, searchQuery, preferences]);

  const allSectors = useMemo(() => {
    const set = new Set<string>();
    pitches.forEach(p => {
      if (p.sector) set.add(p.sector);
    });
    performers.forEach(c => {
      if (c.type) set.add(c.type);
    });
    return Array.from(set);
  }, [pitches, performers]);

  const visiblePitches = useMemo(() => {
    return filteredPitches.filter((p) => !hiddenPitches.has(p.id));
  }, [filteredPitches, hiddenPitches]);

  const shownPitches = useMemo(
    () => visiblePitches.slice(0, renderCount),
    [visiblePitches, renderCount]
  );
  const hasMorePitches = renderCount < visiblePitches.length;

  // Back to the first chunk whenever the filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenderCount(PITCH_CHUNK);
  }, [typeFilter, stageFilter, sectorFilter, searchQuery, onlyPreferences]);

  useEffect(() => {
    const el = pitchSentinelRef.current;
    if (!el || !hasMorePitches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setRenderCount((c) => c + PITCH_CHUNK);
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMorePitches, renderCount, loadingPitches]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-24">
      {view === "pitches" && (
        <section className="space-y-4">
          
          {/* Filter Bar */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Type Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {(["ALL", "PITCH", "PRODUCT", "IDEA"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                      typeFilter === t
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t === "ALL" ? "All Deals" : t === "PITCH" ? "Pitch Decks" : t === "PRODUCT" ? "Live Products" : "Early Ideas"}
                  </button>
                ))}
              </div>

              {/* Preference toggle */}
              {preferences?.sectors?.length ? (
                <button
                  onClick={() => setOnlyPreferences(prev => !prev)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                    onlyPreferences
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Matches My Sectors Only</span>
                </button>
              ) : null}
            </div>

            {/* Search and Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals, keywords, or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Funding Stages</option>
                <option value="Pre-seed">Pre-seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B+">Series B+</option>
              </select>

              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Sectors & Industries</option>
                {allSectors.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingPitches ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                    <div className="flex gap-3 items-center">
                      <Skeleton circle width={44} height={44} />
                      <div className="flex-1">
                        <Skeleton width="60%" height={16} />
                        <Skeleton width="30%" height={12} className="mt-1" />
                      </div>
                    </div>
                    <Skeleton height={20} width="80%" />
                    <Skeleton count={2} height={12} />
                    <Skeleton height={36} borderRadius={8} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : visiblePitches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              <Sparkles className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">No pitches match your current filters</h3>
              <p className="mt-1 text-xs text-gray-500">Try loosening your search terms or toggling all sectors.</p>
              <button
                onClick={() => {
                  setTypeFilter("ALL");
                  setStageFilter("ALL");
                  setSectorFilter("ALL");
                  setSearchQuery("");
                  setOnlyPreferences(false);
                }}
                className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shownPitches.map((pitch) => {
                const typeColor =
                  pitch.type === "PITCH"
                    ? "bg-[#EFF6FF] text-[#2563EB] border-blue-200"
                    : pitch.type === "PRODUCT"
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-neutral-100 text-neutral-700 border-neutral-200";

                const typeLabel =
                  pitch.type === "PITCH"
                    ? "Pitch Deck"
                    : pitch.type === "PRODUCT"
                    ? "Live Product"
                    : "Early Idea";

                const services = (pitch.sector
                  ? pitch.sector.split(",").map((s) => s.trim()).filter(Boolean)
                  : ["General"]
                ).slice(0, 4);

                return (
                  <ScrollReveal key={pitch.id} direction="up" delay={0.05}>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-3 hover:border-gray-300 transition duration-150 h-full">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/profile/${pitch.userId}`}
                          className="flex items-center gap-3 min-w-0 group"
                        >
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100 border border-[#E5E7EB]">
                            {pitch.company.logoUrl ? (
                              <Image
                                src={pitch.company.logoUrl}
                                alt={pitch.company.companyName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                                {pitch.company.companyName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-[#172033] truncate group-hover:text-[#2563EB]">
                                {pitch.company.companyName}
                              </h3>
                              <VerificationBadge
                                status={pitch.company.isVerified ? "VERIFIED" : "UNVERIFIED"}
                                size="sm"
                              />
                            </div>
                            <p className="flex items-center gap-1 text-xs text-[#64748B] truncate">
                              <MapPin size={11} /> {pitch.company.type || "Startup"}
                              {pitch.company.location ? ` · ${pitch.company.location}` : ""}
                            </p>
                          </div>
                        </Link>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div
                            className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200"
                            title={`Average Rating: ${Number(pitch.averageRating || 0).toFixed(1)} / 5 (${pitch.ratingCount || 0} reviews)`}
                          >
                            <Star size={11} className="fill-[#2563EB] text-[#2563EB] shrink-0" />
                            <span>{Number(pitch.averageRating || 0) > 0 ? Number(pitch.averageRating).toFixed(1) : "0.0"}</span>
                            <span className="text-[9px] text-[#64748B] font-semibold">({pitch.ratingCount || 0})</span>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                              aria-label="More options"
                            >
                              <MoreVertical size={16} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {pitch.connectionStatus === "ACCEPTED" ? (
                                <>
                                  <DropdownMenuItem disabled className="gap-2 font-semibold text-emerald-600 opacity-100">
                                    <UserCheck size={14} /> Connected
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                    <Link href={`/messages/${pitch.userId}`} onClick={() => recordPitchView(pitch.id)}>
                                      <MessageCircle size={14} /> Message
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => setConfirm({ kind: "disconnect", pitch })}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <UserMinus size={14} /> Remove connection
                                  </DropdownMenuItem>
                                </>
                              ) : pitch.connectionStatus === "PENDING" ? (
                                <DropdownMenuItem
                                  onSelect={() => handleCancelPitchRequest(pitch)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Clock size={14} /> Request sent · Cancel
                                </DropdownMenuItem>
                              ) : pitch.connectionStatus === "INCOMING" ? (
                                <DropdownMenuItem
                                  onSelect={() => handleAcceptPitchRequest(pitch)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <UserCheck size={14} /> Accept request
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    recordPitchView(pitch.id);
                                    setSelectedConnectCompany({
                                      id: pitch.userId,
                                      name: pitch.company.companyName,
                                    });
                                  }}
                                  className="gap-2 cursor-pointer"
                                >
                                  <UserPlus size={14} /> Connect
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onSelect={() => {
                                  recordPitchView(pitch.id);
                                  setOfferTarget({
                                    pitchId: pitch.id,
                                    pitchTitle: pitch.title,
                                    companyName: pitch.company.companyName,
                                  });
                                }}
                                className="gap-2 cursor-pointer text-emerald-700 font-semibold"
                              >
                                <DollarSign size={14} /> Make Offer
                              </DropdownMenuItem>

                              {pitch.pitchDeckUrl && (
                                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                  <a
                                    href={pitch.pitchDeckUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => recordPitchView(pitch.id)}
                                  >
                                    <FileText size={14} /> Pitch Deck (PDF)
                                  </a>
                                </DropdownMenuItem>
                              )}

                              {!pitch.isRated && (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    recordPitchView(pitch.id);
                                    setRateTarget({
                                      pitchId: pitch.id,
                                      pitchTitle: pitch.title,
                                    });
                                  }}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Star size={14} /> Rate Idea
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onSelect={() => handleDeletePitch(pitch)}
                                className="gap-2 cursor-pointer"
                              >
                                <Trash2 size={14} /> Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setConfirm({ kind: "block", pitch })}
                                className="gap-2 cursor-pointer"
                              >
                                <Ban size={14} /> Block
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  setReportTarget({
                                    userId: pitch.userId,
                                    companyName: pitch.company.companyName,
                                  })
                                }
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Flag size={14} /> Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[#64748B]">Services</span>
                        {services.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#172033]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Stages */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[#64748B]">Stages</span>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] text-blue-700">
                          {pitch.stage}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor}`}>
                          {typeLabel}
                        </span>
                      </div>

                      {/* Looking for */}
                      <p className="text-xs text-[#172033]">
                        <span className="text-[#64748B]">Looking for </span>
                        <strong>
                          {pitch.targetAmount
                            ? `${formatTargetAmount(pitch.targetAmount)}${pitch.equityOffered ? ` · ${pitch.equityOffered} Equity` : ""}`
                            : "Strategic Capital & Growth Partnerships"}
                        </strong>
                      </p>

                      {/* Summary / Bio text */}
                      <BioText
                        title={pitch.title}
                        bio={pitch.tagline || formatDescription(pitch.summary)}
                        onViewDetails={() => {
                          recordPitchView(pitch.id);
                          setSelectedPitch(pitch);
                        }}
                      />

                      {/* Stats Box: Connections & Views */}
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F8FAFC] p-3 text-center">
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-[#64748B]">
                            Connections
                          </span>
                          <span className="text-base font-bold text-[#172033]">
                            {pitch.connections ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-[#64748B]">
                            Views
                          </span>
                          <span className="text-base font-bold text-[#172033]">
                            {pitch.views ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Collaboration Request Button */}
                      <button
                        type="button"
                        onClick={() => {
                          recordPitchView(pitch.id);
                          setCollaborationTarget({
                            recipientId: pitch.userId,
                            companyName: pitch.company.companyName,
                          });
                        }}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                      >
                        <Handshake size={14} /> Collaboration Request
                      </button>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
            {hasMorePitches && <div ref={pitchSentinelRef} className="h-12" />}
            </>
          )}
        </section>
      )}

      {view === "performers" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#EFF6FF] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                Company Doing Good
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Ranked by accepted connections, posts, comments, pitches, and accepted investment offers.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-2 border border-[#E5E7EB] shrink-0 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Traction Ranking</span>
              <p className="text-xs font-extrabold text-[#172033] mt-0.5">Top 1% Network Leaders</p>
            </div>
          </div>

          {loadingPerformers ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                    <div className="flex gap-3">
                      <Skeleton circle width={48} height={48} />
                      <div className="flex-1">
                        <Skeleton width="50%" height={16} />
                        <Skeleton width="30%" height={12} className="mt-1" />
                      </div>
                    </div>
                    <Skeleton count={2} height={12} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : performers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">No preference matches calculated yet</h3>
              <p className="mt-1 text-xs text-gray-500">Update your investor sectors in your profile settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performers.map((company, index) => (
                <ScrollReveal key={company.id} direction="up" delay={0.05 * index}>
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 hover:border-gray-300 transition duration-150 flex flex-col justify-between h-full">
                    <div>
                      {/* Top Bar with Score */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <Link href={`/profile/${company.userId}`} className="flex items-center gap-3 group min-w-0">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-[#E5E7EB]">
                            {company.logoUrl ? (
                              <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                                {company.companyName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-[#172033] text-sm truncate group-hover:text-[#2563EB] group-hover:underline">
                                {company.companyName}
                              </h3>
                              <VerificationBadge status={company.isVerified ? "VERIFIED" : "UNVERIFIED"} size="sm" />
                            </div>
                            <p className="text-xs text-[#64748B] truncate">{company.type} · {company.location || "Global"}</p>
                          </div>
                        </Link>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-bold text-[#2563EB] border border-blue-200">
                            {company.matchPercentage}% Match
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-[#64748B]">
                          {formatDescription(company.description)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedPerformer(company)}
                          className="mt-1 text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          View company details
                        </button>
                      </div>

                      {/* Performance Badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {company.badges.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      {/* Traction Metrics */}
                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#F8F4E8] border border-[#E5E7EB] p-2.5 text-center">
                        <div>
                          <span className="block text-xs font-bold text-[#172033]">{company.stats.followers}</span>
                          <span className="text-[10px] text-[#64748B]">Followers</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#172033]">{company.stats.connections}</span>
                          <span className="text-[10px] text-[#64748B]">Connections</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#2563EB]">+{company.stats.recentViews}</span>
                          <span className="text-[10px] text-[#64748B]">Views this week</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold text-gray-500">
                        {company.dealIn?.length ? `Deals in: ${company.dealIn.slice(0, 2).join(", ")}` : "High Compatibility"}
                      </span>

                      <div className="flex items-center gap-2">
                        {company.connectionStatus === "ACCEPTED" ? (
                          <Link
                            href={`/messages/${company.userId}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                          >
                            <MessageSquare size={12} /> Message
                          </Link>
                        ) : company.connectionStatus === "PENDING" ? (
                          <button
                            onClick={() =>
                              setConfirmCancelTarget({
                                userId: company.userId,
                                connectionId: company.connectionId,
                                name: company.companyName,
                              })
                            }
                            disabled={cancellingUserId === company.userId}
                            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-amber-600 border border-amber-500 hover:bg-amber-50 hover:border-amber-600 transition disabled:opacity-50 cursor-pointer"
                            title="Connection request is pending. Click to cancel request."
                          >
                            {cancellingUserId === company.userId ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Clock size={12} />
                            )}
                            Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedConnectCompany({ id: company.userId, name: company.companyName })}
                            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                          >
                            Connect
                          </button>
                        )}
                        <Link
                          href={`/profile/${company.userId}`}
                          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>
      )}

      <Dialog
        open={selectedPerformer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPerformer(null);
        }}
      >
        {selectedPerformer && (
          <DialogContent className="max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-7">
            <DialogHeader className="gap-2">
              <DialogTitle className="pr-8 text-xl font-bold text-[#172033]">
                {selectedPerformer.companyName}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                {selectedPerformer.type} · {selectedPerformer.location || "Global"} · {selectedPerformer.matchPercentage}% match
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
              <section>
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">About this company</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#172033]">
                  {formatDescription(selectedPerformer.description) || "No company description provided."}
                </p>
              </section>

              {selectedPerformer.dealIn?.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Services and sectors</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPerformer.dealIn.map((item) => (
                      <span key={item} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {selectedPerformer.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPerformer.badges.map((badge) => (
                    <span key={badge} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-wrap justify-start gap-2 border-t border-[#E5E7EB] pt-4 sm:justify-start">
              {selectedPerformer.connectionStatus === "ACCEPTED" ? (
                <Link
                  href={`/messages/${selectedPerformer.userId}`}
                  onClick={() => setSelectedPerformer(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <MessageSquare size={14} /> Message
                </Link>
              ) : selectedPerformer.connectionStatus === "PENDING" ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCancelTarget({
                      userId: selectedPerformer.userId,
                      connectionId: selectedPerformer.connectionId,
                      name: selectedPerformer.companyName,
                    });
                    setSelectedPerformer(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500 bg-white px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50"
                >
                  <Clock size={14} /> Cancel pending request
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConnectCompany({ id: selectedPerformer.userId, name: selectedPerformer.companyName });
                    setSelectedPerformer(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Send size={14} /> Connect
                </button>
              )}
              <Link
                href={`/profile/${selectedPerformer.userId}`}
                onClick={() => setSelectedPerformer(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink size={14} /> View company
              </Link>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={selectedPitch !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPitch(null);
        }}
      >
        {selectedPitch && (
          <DialogContent className="max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-7">
            <DialogHeader className="gap-2">
              <DialogTitle className="pr-8 text-xl font-bold text-[#172033]">
                {selectedPitch.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748B]">
                {selectedPitch.company.companyName} · {selectedPitch.sector} · {selectedPitch.stage}
              </DialogDescription>
            </DialogHeader>

            {selectedPitch.tagline && (
              <p className="text-sm font-medium text-[#2563EB]">{selectedPitch.tagline}</p>
            )}

            <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
              <section>
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">Overview</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#172033]">
                  {formatDescription(selectedPitch.summary)}
                </p>
              </section>

              {selectedPitch.highlights?.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Highlights</h3>
                  <ul className="space-y-2">
                    {selectedPitch.highlights.map((highlight, index) => (
                      <li key={`${selectedPitch.id}-highlight-${index}`} className="flex items-start gap-2 text-sm leading-5 text-[#172033]">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2563EB]" />
                        <span className="break-words">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Target Raise</span>
                  <p className="mt-1 text-sm font-bold text-[#172033]">
                    {selectedPitch.targetAmount ? formatTargetAmount(selectedPitch.targetAmount) : "Strategic Capital"}
                  </p>
                </div>
                {selectedPitch.equityOffered && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Terms / Structure</span>
                    <p className="mt-1 text-sm font-bold text-[#2563EB]">{selectedPitch.equityOffered}</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-wrap justify-start gap-2 border-t border-[#E5E7EB] pt-4 sm:justify-start">
              {selectedPitch.connectionStatus === "ACCEPTED" ? (
                <Link
                  href={`/messages/${selectedPitch.userId}`}
                  onClick={() => setSelectedPitch(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <MessageSquare size={14} /> Message
                </Link>
              ) : selectedPitch.connectionStatus === "PENDING" ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCancelTarget({
                      userId: selectedPitch.userId,
                      connectionId: selectedPitch.connectionId,
                      name: selectedPitch.company.companyName,
                    });
                    setSelectedPitch(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500 bg-white px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50"
                >
                  <Clock size={14} /> Cancel pending request
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConnectCompany({
                      id: selectedPitch.userId,
                      name: selectedPitch.company.companyName,
                    });
                    setSelectedPitch(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Send size={14} /> Connect
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setOfferTarget({
                    pitchId: selectedPitch.id,
                    pitchTitle: selectedPitch.title,
                    companyName: selectedPitch.company.companyName,
                  });
                  setSelectedPitch(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500 bg-white px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
              >
                <DollarSign size={14} /> Make an offer
              </button>
              {!selectedPitch.isRated && (
                <button
                  type="button"
                  onClick={() => {
                    setRateTarget({ pitchId: selectedPitch.id, pitchTitle: selectedPitch.title });
                    setSelectedPitch(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500 bg-white px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50"
                >
                  <Star size={14} /> Rate
                </button>
              )}
              <Link
                href={`/profile/${selectedPitch.userId}`}
                onClick={() => setSelectedPitch(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink size={14} /> View company
              </Link>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Connect Modal */}
      {selectedConnectCompany && (
        <ConnectModal
          receiverId={selectedConnectCompany.id}
          companyName={selectedConnectCompany.name}
          onClose={() => setSelectedConnectCompany(null)}
          onSuccess={(msg) => {
            toast.success(msg);
            setSelectedConnectCompany(null);
            fetchPitches();
            fetchPerformers();
          }}
        />
      )}

      {/* Make Offer Modal */}
      {offerTarget && (
        <MakeOfferModal
          pitchId={offerTarget.pitchId}
          pitchTitle={offerTarget.pitchTitle}
          companyName={offerTarget.companyName}
          onClose={() => setOfferTarget(null)}
          onSuccess={() => {
            fetchPitches();
          }}
        />
      )}

      {/* Rate Pitch Modal */}
      {rateTarget && (
        <RatePitchModal
          pitchId={rateTarget.pitchId}
          pitchTitle={rateTarget.pitchTitle}
          currentRating={rateTarget.currentRating}
          currentFeedback={rateTarget.currentFeedback}
          onClose={() => setRateTarget(null)}
          onSuccess={() => {
            fetchPitches();
          }}
        />
      )}

      {/* Cancel Connection Request Confirmation Modal */}
      {confirmCancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Cancel Request?</h3>
                <p className="text-xs text-gray-500">Connection is currently pending</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Do you want to cancel your connection request to <strong className="text-gray-900">{confirmCancelTarget.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelTarget(null)}
                className="rounded-xl border border-amber-500 bg-white px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition"
              >
                Keep Pending
              </button>
              <button
                type="button"
                disabled={cancellingUserId === confirmCancelTarget.userId}
                onClick={async () => {
                  const target = confirmCancelTarget;
                  setConfirmCancelTarget(null);
                  await handleCancelConnection(target.userId, target.connectionId);
                }}
                className="rounded-xl border border-red-500 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Modal */}
      {collaborationTarget && (
        <CollaborateModal
          recipientId={collaborationTarget.recipientId}
          companyName={collaborationTarget.companyName}
          onClose={() => setCollaborationTarget(null)}
          onSuccess={() => {
            setCollaborationTarget(null);
            fetchPitches();
          }}
        />
      )}

      {/* Report Company Modal */}
      {reportTarget && (
        <ReportCompanyModal
          companyUserId={reportTarget.userId}
          companyName={reportTarget.companyName}
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* Confirm Disconnect / Block Modal */}
      <ConfirmModal
        isOpen={!!confirm}
        title={
          confirm?.kind === "block"
            ? `Block ${confirm.pitch.company.companyName}?`
            : `Remove connection with ${confirm?.pitch.company.companyName}?`
        }
        message={
          confirm?.kind === "block"
            ? "They won't be able to view your profile, send requests, or collaborate with you. Any active connection will be dropped."
            : "You will no longer be connected. You can reconnect at any time."
        }
        confirmText={confirm?.kind === "block" ? "Block Company" : "Remove Connection"}
        cancelText="Cancel"
        variant="danger"
        isLoading={confirming}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
