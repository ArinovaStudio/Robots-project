"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  DollarSign,
  Star,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Building2,
  Compass,
  MessageSquare,
  Landmark,
  Eye,
  Layers,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import AddPitchModal from "@/components/modals/add-pitch-modal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatTargetAmount } from "@/lib/utils";
import ReadMoreText from "@/components/ui/read-more-text";

interface CreatedPitch {
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
  viewCount: number;
  offerCount: number;
  totalOfferAmount: number;
  ratingCount: number;
  averageRating: number;
}

interface SubmittedOffer {
  id: string;
  pitchId: string;
  amount: string;
  amountValue: number;
  terms: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  pitchTitle: string;
  sector: string;
  stage: string;
  pitchType: string;
  companyName: string;
  logoUrl: string | null;
  location: string | null;
  founderName: string | null;
  founderId: string;
}

interface SubmittedRating {
  id: string;
  pitchId: string;
  rating: number;
  feedback: string | null;
  createdAt: string;
  pitchTitle: string;
  sector: string;
  stage: string;
  pitchType: string;
  companyName: string;
  logoUrl: string | null;
  founderName: string | null;
  founderId: string;
}

export default function InvestorPitchesClient() {
  const [activeTab, setActiveTab] = useState<"created" | "offers" | "ratings">("created");
  const [createdPitches, setCreatedPitches] = useState<CreatedPitch[]>([]);
  const [offers, setOffers] = useState<SubmittedOffer[]>([]);
  const [ratings, setRatings] = useState<SubmittedRating[]>([]);
  const [stats, setStats] = useState({
    createdCount: 0,
    offersCount: 0,
    totalOfferedAmount: 0,
    ratingsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddPitchModal, setShowAddPitchModal] = useState(false);
  const [confirmCancelOfferTarget, setConfirmCancelOfferTarget] = useState<SubmittedOffer | null>(null);
  const [cancellingOfferId, setCancellingOfferId] = useState<string | null>(null);

  const handleCancelOffer = async (offer: SubmittedOffer) => {
    setCancellingOfferId(offer.id);
    try {
      const res = await fetch(`/api/company/pitches/offers/${offer.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Investment offer cancelled");
        setOffers((prev) => prev.filter((o) => o.id !== offer.id));
        setStats((prev) => ({
          ...prev,
          offersCount: Math.max(0, prev.offersCount - 1),
          totalOfferedAmount: Math.max(0, prev.totalOfferedAmount - (offer.amountValue || 0)),
        }));
      } else {
        toast.error(data.message || "Failed to cancel offer");
      }
    } catch {
      toast.error("Failed to cancel offer");
    } finally {
      setCancellingOfferId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/investor/my-pitches");
      const json = await res.json();
      if (json.success && json.data) {
        setCreatedPitches(json.data.createdPitches || []);
        setOffers(json.data.offers || []);
        setRatings(json.data.ratings || []);
        setStats(json.data.stats || {
          createdCount: 0,
          offersCount: 0,
          totalOfferedAmount: 0,
          ratingsCount: 0,
        });
      } else {
        toast.error(json.message || "Failed to load pitches");
      }
    } catch {
      toast.error("Failed to load your pitches & offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1E3A5F] p-8 text-white border border-[#1E3A5F]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 mb-3">
              <Landmark className="w-3.5 h-3.5 text-blue-300" />
              <span>Investor Deal Pipeline</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              My Pitches & Deal Engagements
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Track your published pitches and ideas, review investment offers you submitted to startups, and monitor evaluated deals in your portfolio.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddPitchModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white transition"
            >
              <PlusCircle className="w-4 h-4" />
              Publish Pitch / Idea
            </button>
            <Link
              href="/investors/portal"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <Compass className="w-3.5 h-3.5" />
              Explore Investor Portal
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="relative z-10 mt-8 flex border-b border-white/15 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("created")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "created"
                ? "border-blue-400 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            My Created Pitches ({stats.createdCount})
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "offers"
                ? "border-blue-400 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            My Investment Offers ({stats.offersCount})
          </button>
          <button
            onClick={() => setActiveTab("ratings")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "ratings"
                ? "border-blue-400 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Star className="w-4 h-4" />
            Evaluated Deals ({stats.ratingsCount})
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Pitches Created</span>
          <p className="mt-1 text-2xl font-black text-[#172033]">{stats.createdCount}</p>
          <span className="text-[11px] text-[#64748B]">Published to portal</span>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Offers Submitted</span>
          <p className="mt-1 text-2xl font-black text-[#2563EB]">{stats.offersCount}</p>
          <span className="text-[11px] text-[#64748B]">Startup investment offers</span>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Capital Offered</span>
          <p className="mt-1 text-2xl font-black text-[#172033]">
            {stats.totalOfferedAmount > 0
              ? formatTargetAmount(stats.totalOfferedAmount)
              : "₹0"}
          </p>
          <span className="text-[11px] text-[#64748B]">Across pending & accepted</span>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Deals Evaluated</span>
          <p className="mt-1 text-2xl font-black text-[#2563EB]">{stats.ratingsCount}</p>
          <span className="text-[11px] text-[#64748B]">Reviews & ratings provided</span>
        </div>
      </div>

      {/* TAB 1: CREATED PITCHES */}
      {activeTab === "created" && (
        <section className="space-y-4">
          {loading ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                    <Skeleton height={20} width="60%" />
                    <Skeleton count={2} height={12} />
                    <Skeleton height={36} borderRadius={8} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : createdPitches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 space-y-3">
              <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="text-base font-bold text-gray-800">You haven&apos;t created any pitches yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Publish a pitch, product, or early investment thesis to share it with other entrepreneurs and network participants.
              </p>
              <button
                onClick={() => setShowAddPitchModal(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <PlusCircle size={14} /> Create Your First Pitch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {createdPitches.map((pitch) => {
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
                    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 hover:border-gray-300 transition flex flex-col justify-between h-full">
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-medium text-[#64748B]">{pitch.sector}</span>
                            <h3 className="text-base font-bold text-[#172033] mt-0.5">{pitch.title}</h3>
                            {pitch.tagline && (
                              <p className="text-xs font-medium text-[#2563EB] mt-0.5">{pitch.tagline}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {/* Average rating */}
                            <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
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

                        {/* Summary with ReadMoreText */}
                        <div className="mt-3">
                          <ReadMoreText
                            text={pitch.summary}
                            charLimit={150}
                            title={pitch.title}
                            subtitle={`${pitch.stage} · ${pitch.sector}`}
                            className="text-xs text-[#64748B] leading-relaxed"
                          />
                        </div>

                        {/* Highlights */}
                        {pitch.highlights?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
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

                      {/* Footer: Ask / Stats */}
                      <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Target Raise</span>
                            <p className="text-sm font-extrabold text-gray-900">
                              {pitch.targetAmount ? formatTargetAmount(pitch.targetAmount) : "Not Specified"}
                            </p>
                          </div>
                          {pitch.equityOffered && (
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Terms</span>
                              <p className="text-xs font-bold text-blue-700">{pitch.equityOffered}</p>
                            </div>
                          )}
                        </div>

                        {/* Traction Metrics */}
                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F8F4E8] border border-[#E5E7EB] p-2 text-center text-xs">
                          <div>
                            <span className="block font-bold text-[#172033]">{pitch.viewCount}</span>
                            <span className="text-[10px] text-[#64748B]">Views</span>
                          </div>
                          <div>
                            <span className="block font-bold text-[#2563EB]">{pitch.offerCount}</span>
                            <span className="text-[10px] text-[#64748B]">Offers</span>
                          </div>
                          <div>
                            <span className="block font-bold text-[#2563EB]">
                              {Number(pitch.averageRating || 0) > 0 ? Number(pitch.averageRating).toFixed(1) : "0.0"}★
                            </span>
                            <span className="text-[10px] text-[#64748B]">Rating</span>
                          </div>
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

      {/* TAB 2: INVESTMENT OFFERS MADE */}
      {activeTab === "offers" && (
        <section className="space-y-4">
          {loading ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                    <Skeleton height={18} width="40%" />
                    <Skeleton count={2} height={12} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 space-y-3">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="text-base font-bold text-gray-800">No investment offers submitted yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Explore deal opportunities in the investor portal and submit investment offers directly to founders.
              </p>
              <Link
                href="/investors/portal"
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Compass size={14} /> Browse Deals
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => {
                const statusBadge =
                  offer.status === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : offer.status === "DECLINED"
                    ? "bg-red-100 text-red-800 border-red-300"
                    : "bg-amber-100 text-amber-800 border-amber-300";

                return (
                  <ScrollReveal key={offer.id} direction="up" delay={0.03}>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{offer.companyName}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{offer.sector} ({offer.stage})</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-gray-900 mt-0.5 truncate">
                            {offer.pitchTitle}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Offer: <strong className="text-gray-900">{formatTargetAmount(offer.amount)}</strong> · Terms: <span className="font-semibold text-blue-700">{offer.terms}</span>
                          </p>
                          {offer.message && (
                            <p className="text-xs text-gray-600 italic mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              &ldquo;{offer.message}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {offer.status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => setConfirmCancelOfferTarget(offer)}
                              disabled={cancellingOfferId === offer.id}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer disabled:opacity-50"
                              title="Click to cancel pending investment offer"
                            >
                              {cancellingOfferId === offer.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Clock size={12} />
                              )}
                              <span>Pending</span>
                            </button>
                          ) : (
                            <span className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${statusBadge}`}>
                              {offer.status}
                            </span>
                          )}
                          {offer.status === "ACCEPTED" && (
                            <Link
                              href={`/messages/${offer.founderId}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                            >
                              <MessageSquare size={13} /> Message
                            </Link>
                          )}
                          <Link
                            href={`/profile/${offer.founderId}`}
                            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                            title="View Founder Profile"
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

      {/* TAB 3: EVALUATED DEALS */}
      {activeTab === "ratings" && (
        <section className="space-y-4">
          {loading ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
                    <Skeleton height={18} width="50%" />
                    <Skeleton count={2} height={12} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : ratings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 space-y-3">
              <Star className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="text-base font-bold text-gray-800">No deals evaluated yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Rate and review startup ideas in the investor portal to share your evaluation and track feedback.
              </p>
              <Link
                href="/investors/portal"
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Compass size={14} /> Go to Investor Portal
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratings.map((rating) => (
                <ScrollReveal key={rating.id} direction="up" delay={0.03}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-medium text-gray-400">{rating.companyName}</span>
                          <h4 className="text-sm font-bold text-gray-900 mt-0.5">{rating.pitchTitle}</h4>
                          <span className="text-[11px] text-gray-500">{rating.sector} · {rating.stage}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                          <Star size={13} className="fill-[#2563EB] text-[#2563EB]" />
                          <span>{rating.rating} / 5</span>
                        </div>
                      </div>

                      {rating.feedback && (
                        <p className="mt-3 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          &ldquo;{rating.feedback}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[11px]">
                        Evaluated {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/profile/${rating.founderId}`}
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1 text-xs"
                      >
                        View Company <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Add Pitch Modal */}
      {showAddPitchModal && (
        <AddPitchModal
          onClose={() => setShowAddPitchModal(false)}
          onSuccess={() => {
            setShowAddPitchModal(false);
            fetchData();
          }}
        />
      )}

      {/* Cancel Offer Confirmation Modal */}
      {confirmCancelOfferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Cancel Investment Offer?</h3>
                <p className="text-xs text-gray-500">This pending offer will be withdrawn</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel your investment offer of <strong className="text-gray-900">{formatTargetAmount(confirmCancelOfferTarget.amount)}</strong> to <strong className="text-gray-900">{confirmCancelOfferTarget.companyName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelOfferTarget(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Offer
              </button>
              <button
                type="button"
                disabled={cancellingOfferId === confirmCancelOfferTarget.id}
                onClick={async () => {
                  const target = confirmCancelOfferTarget;
                  setConfirmCancelOfferTarget(null);
                  await handleCancelOffer(target);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                Yes, Cancel Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
