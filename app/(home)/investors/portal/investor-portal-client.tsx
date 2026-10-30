"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Target,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Building2,
  ArrowRight,
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
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import { useUserStore } from "@/store/AuthStore";
import { useSearchParams } from "next/navigation";
import ConnectModal from "@/components/modals/connect-modal";
import MakeOfferModal from "@/components/modals/make-offer-modal";
import RatePitchModal from "@/components/modals/rate-pitch-modal";
import VerificationBadge from "@/components/ui/VerificationBadge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatTargetAmount } from "@/lib/utils";
import ReadMoreText from "@/components/ui/read-more-text";

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

export default function InvestorPortalClient() {
  const { user } = useUserStore();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "performers" ? "performers" : "pitches";

  const [activeTab, setActiveTab] = useState<"pitches" | "performers">(initialTab);
  const [pitches, setPitches] = useState<PitchItem[]>([]);
  const [performers, setPerformers] = useState<PreferenceCompany[]>([]);
  const [preferences, setPreferences] = useState<{ sectors: string[]; stages: string[]; investmentRange: string } | null>(null);

  const [loadingPitches, setLoadingPitches] = useState(true);
  const [loadingPerformers, setLoadingPerformers] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PITCH" | "PRODUCT" | "IDEA">("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyPreferences, setOnlyPreferences] = useState(false);

  // Connect modal state
  const [selectedConnectCompany, setSelectedConnectCompany] = useState<{ id: string; name: string } | null>(null);
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
    fetchPitches();
    fetchPerformers();
  }, []);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1E3A5F] p-8 text-white border border-[#1E3A5F]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Investor Deal Flow & Pitches</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Discover Ideas, Products & Pitches
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Explore vetted B2B companies raising capital, discover innovative products and early-stage ideas, and connect with companies doing good in your preferences.
            </p>

            {preferences?.sectors?.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-slate-400">Your Selected Preferences:</span>
                {preferences.sectors.map((sec) => (
                  <span key={sec} className="rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-blue-200 border border-white/10">
                    {sec}
                  </span>
                ))}
                {preferences.investmentRange && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-blue-200 border border-white/20">
                    Range: {preferences.investmentRange}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Active Opportunities</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{pitches.length}</span>
                <span className="text-xs text-blue-300">Deals in Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="relative z-10 mt-8 flex border-b border-white/15">
          <button
            onClick={() => setActiveTab("pitches")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === "pitches"
                ? "border-blue-400 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Ideas, Products & Pitches ({pitches.length})
          </button>
          <button
            onClick={() => setActiveTab("performers")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === "performers"
                ? "border-blue-400 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Companies Doing Good in Your Preferences ({performers.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PITCHES, PRODUCTS & IDEAS */}
      {activeTab === "pitches" && (
        <section className="space-y-6">
          {/* Filter Bar */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex gap-4 items-center">
                      <Skeleton circle width={48} height={48} />
                      <div className="flex-1">
                        <Skeleton width="60%" height={16} />
                        <Skeleton width="30%" height={12} className="mt-1" />
                      </div>
                    </div>
                    <Skeleton height={20} width="80%" />
                    <Skeleton count={3} height={12} />
                    <Skeleton height={36} borderRadius={8} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : filteredPitches.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPitches.map((pitch) => {
                const typeColor =
                  pitch.type === "PITCH"
                    ? "bg-[#EFF6FF] text-[#2563EB] border-blue-200"
                    : pitch.type === "PRODUCT"
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-neutral-100 text-neutral-700 border-neutral-200";

                const typeLabel =
                  pitch.type === "PITCH"
                    ? "Formal Pitch"
                    : pitch.type === "PRODUCT"
                    ? "Live Product"
                    : "Early Idea";

                return (
                  <ScrollReveal key={pitch.id} direction="up" delay={0.05}>
                    <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 hover:border-gray-300 transition duration-150 h-full">
                      <div>
                        {/* Header: Company & Badges */}
                        <div className="flex items-start justify-between gap-3">
                          <Link href={`/profile/${pitch.userId}`} className="flex items-center gap-3 group min-w-0">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-[#E5E7EB]">
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
                                <h3 className="font-bold text-[#172033] text-sm truncate group-hover:text-[#2563EB] group-hover:underline">
                                  {pitch.company.companyName}
                                </h3>
                                <VerificationBadge status={pitch.company.isVerified ? "VERIFIED" : "UNVERIFIED"} size="sm" />
                              </div>
                              <p className="text-xs text-[#64748B] truncate flex items-center gap-1 mt-0.5">
                                {pitch.company.location && (
                                  <>
                                    <MapPin size={11} /> {pitch.company.location} ·{" "}
                                  </>
                                )}
                                {pitch.sector}
                              </p>
                            </div>
                          </Link>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {/* Average rating shown above early idea or type */}
                            <div
                              className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200"
                              title={`Average Rating: ${Number(pitch.averageRating || 0).toFixed(1)} / 5 (${pitch.ratingCount || 0} reviews)`}
                            >
                              <Star size={11} className="fill-[#2563EB] text-[#2563EB] shrink-0" />
                              <span>{Number(pitch.averageRating || 0) > 0 ? Number(pitch.averageRating).toFixed(1) : "0.0"}</span>
                              <span className="text-[9px] text-[#64748B] font-semibold">({pitch.ratingCount || 0})</span>
                            </div>

                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor}`}>
                              {typeLabel}
                            </span>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              {pitch.stage}
                            </span>
                          </div>
                        </div>

                        {/* Title & Tagline */}
                        <div className="mt-4">
                          <h4 className="text-base font-bold text-[#172033] leading-snug">
                            {pitch.title}
                          </h4>
                          {pitch.tagline && (
                            <p className="mt-1 text-xs font-medium text-[#2563EB]">
                              {pitch.tagline}
                            </p>
                          )}
                          <ReadMoreText
                            text={pitch.summary}
                            charLimit={150}
                            title={pitch.title}
                            subtitle={`${pitch.company.companyName} · ${pitch.sector}`}
                            className="mt-2 text-xs text-[#64748B] leading-relaxed"
                          />
                        </div>

                        {/* Highlights */}
                        {pitch.highlights?.length > 0 && (
                          <div className="mt-3.5 flex flex-wrap gap-1.5">
                            {pitch.highlights.map((hl, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/60"
                              >
                                <CheckCircle2 size={12} className="text-[#2563EB] shrink-0" />
                                {hl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Ask / Terms + Actions */}
                      <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                        <div className="flex items-center justify-between mb-3.5">
                          {pitch.targetAmount ? (
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Target Raise</span>
                              <p className="text-sm font-extrabold text-gray-900">{formatTargetAmount(pitch.targetAmount)}</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Seeking</span>
                              <p className="text-xs font-semibold text-gray-700">Strategic Capital</p>
                            </div>
                          )}

                          {pitch.equityOffered && (
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Terms / Structure</span>
                              <p className="text-xs font-extrabold text-blue-700">{pitch.equityOffered}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {pitch.connectionStatus === "ACCEPTED" ? (
                            <Link
                              href={`/messages/${pitch.userId}`}
                              onClick={() => recordPitchView(pitch.id)}
                              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                            >
                              <MessageSquare size={13} />
                              Message
                            </Link>
                          ) : pitch.connectionStatus === "PENDING" ? (
                            <button
                              onClick={() =>
                                setConfirmCancelTarget({
                                  userId: pitch.userId,
                                  connectionId: pitch.connectionId,
                                  name: pitch.company.companyName,
                                })
                              }
                              disabled={cancellingUserId === pitch.userId}
                              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition disabled:opacity-50 cursor-pointer"
                              title="Connection request is pending. Click to cancel request."
                            >
                              {cancellingUserId === pitch.userId ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Clock size={13} />
                              )}
                              Pending
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                recordPitchView(pitch.id);
                                setSelectedConnectCompany({ id: pitch.userId, name: pitch.company.companyName });
                              }}
                              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                            >
                              <Send size={13} />
                              Connect
                            </button>
                          )}

                          <button
                            onClick={() => {
                              recordPitchView(pitch.id);
                              setOfferTarget({
                                pitchId: pitch.id,
                                pitchTitle: pitch.title,
                                companyName: pitch.company.companyName,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                            title="Make Investment Offer"
                          >
                            <DollarSign size={13} />
                            Offer
                          </button>

                          {!pitch.isRated && (
                            <button
                              onClick={() => {
                                recordPitchView(pitch.id);
                                setRateTarget({
                                  pitchId: pitch.id,
                                  pitchTitle: pitch.title,
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                              title="Rate Idea (1-5 Stars)"
                            >
                              <Star size={13} />
                              Rate
                            </button>
                          )}

                          <Link
                            href={`/profile/${pitch.userId}`}
                            onClick={() => recordPitchView(pitch.id)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            title="View Full Profile"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: COMPANIES DOING GOOD IN SELECTED PREFERENCES */}
      {activeTab === "performers" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#EFF6FF] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                Top Performing Companies in Your Preferences
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Ranked by real network traction: weekly profile views, follower growth, verified status, and alignment with your preferred sectors ({preferences?.sectors?.join(", ") || "All"}).
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

                      {/* Description */}
                      <ReadMoreText
                        text={company.description}
                        charLimit={120}
                        title={company.companyName}
                        subtitle={`${company.type} · ${company.location || "Global"}`}
                        className="text-xs text-[#64748B] leading-relaxed"
                      />

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
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition disabled:opacity-50 cursor-pointer"
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
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
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
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
