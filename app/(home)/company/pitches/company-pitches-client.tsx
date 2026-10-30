"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  Eye,
  DollarSign,
  Star,
  Users,
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Share2,
  ShieldAlert,
  Loader2,
  ChevronRight,
  MessageSquare,
  FileText
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import AddPitchModal from "@/components/modals/add-pitch-modal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatTargetAmount } from "@/lib/utils";
import ReadMoreText from "@/components/ui/read-more-text";


interface PitchData {
  id: string;
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
  status: string;
  isSharedWithCompanies: boolean;
  feedPostId: string | null;
  collabRequestId: string | null;
  createdAt: string;
  viewCount: number;
  offerCount: number;
  totalOfferAmount: number;
  ratingCount: number;
  averageRating: number;
  views: Array<{
    viewedAt: string;
    investorId: string;
    name: string;
    image: string | null;
    firmName: string | null;
    investorType: string | null;
    location: string | null;
  }>;
  offers: Array<{
    id: string;
    amount: string;
    amountValue: number;
    terms: string | null;
    message: string | null;
    status: string;
    createdAt: string;
    investorId: string;
    name: string;
    image: string | null;
    firmName: string | null;
    investorType: string | null;
  }>;
  ratings: Array<{
    id: string;
    rating: number;
    feedback: string | null;
    createdAt: string;
    investorName: string;
    investorImage: string | null;
    firmName: string | null;
    investorType: string | null;
  }>;
}

export default function CompanyPitchesClient() {
  const [pitches, setPitches] = useState<PitchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Modals for details
  const [viewingInvestorsForPitch, setViewingInvestorsForPitch] = useState<PitchData | null>(null);
  const [viewingOffersForPitch, setViewingOffersForPitch] = useState<PitchData | null>(null);
  const [viewingRatingsForPitch, setViewingRatingsForPitch] = useState<PitchData | null>(null);
  const [previewingPitch, setPreviewingPitch] = useState<PitchData | null>(null);
  const [confirmingSharePitch, setConfirmingSharePitch] = useState<PitchData | null>(null);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);

  const fetchPitches = async () => {
    try {
      const res = await fetch("/api/company/pitches");
      const json = await res.json();
      if (json.success) {
        setPitches(json.data);
      }
    } catch {
      toast.error("Failed to load your pitches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitches();
  }, []);

  const handleShareCollaboration = async (pitch: PitchData) => {
    setSharingLoading(true);
    try {
      const res = await fetch(`/api/company/pitches/${pitch.id}/share-collaboration`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setConfirmingSharePitch(null);
        await fetchPitches();
      } else {
        toast.error(data.message || "Could not publish for collaboration");
      }
    } catch {
      toast.error("An error occurred while publishing.");
    } finally {
      setSharingLoading(false);
    }
  };

  const handleOfferResponse = async (offerId: string, action: "ACCEPTED" | "DECLINED") => {
    setRespondingOfferId(offerId);
    try {
      const res = await fetch(`/api/company/pitches/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchPitches();
        if (viewingOffersForPitch) {
          setViewingOffersForPitch((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              offers: prev.offers.map((o) => (o.id === offerId ? { ...o, status: action } : o)),
            };
          });
        }
        if (previewingPitch) {
          setPreviewingPitch((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              offers: prev.offers.map((o) => (o.id === offerId ? { ...o, status: action } : o)),
            };
          });
        }
      } else {
        toast.error(data.message || "Failed to update offer");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setRespondingOfferId(null);
    }
  };

  const totalViews = pitches.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const totalOffers = pitches.reduce((sum, p) => sum + (p.offerCount || 0), 0);
  const totalOfferedAmount = pitches.reduce((sum, p) => sum + (p.totalOfferAmount || 0), 0);
  const totalRatings = pitches.reduce((sum, p) => sum + (p.ratingCount || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1E3A5F] p-8 text-white border border-[#1E3A5F]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              My Pitches & Funding Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Add new pitches for verified investors, track investor views, review investment offers, and selectively ask other companies for help building your ideas.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white transition shrink-0"
          >
            <PlusCircle size={18} />
            <span>Add New Pitch</span>
          </button>
        </div>

        {/* Global Stats Overview */}
        <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-6">
          <div className="rounded-xl bg-white/10 p-3.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pitches</span>
            <p className="text-2xl font-black text-white mt-0.5">{pitches.length}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investor Views</span>
            <p className="text-2xl font-black text-white mt-0.5">{totalViews}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Capital Offered</span>
            <p className="text-2xl font-black text-white mt-0.5">${totalOfferedAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investor Ratings</span>
            <p className="text-2xl font-black text-blue-200 mt-0.5">{totalRatings} ratings</p>
          </div>
        </div>
      </div>

      {/* Pitches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#172033]">Your Active Pitches & Opportunities</h2>
          <span className="text-xs text-[#64748B]">{pitches.length} total</span>
        </div>

        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                  <Skeleton width="40%" height={24} />
                  <Skeleton count={2} height={14} />
                  <Skeleton height={40} borderRadius={12} />
                </div>
              ))}
            </div>
          </SkeletonTheme>
        ) : pitches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            <Sparkles className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">You haven&apos;t added any pitches yet</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Share your startup ideas, live products, or investment proposals to connect with active angel and VC investors.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <PlusCircle size={15} /> Add Your First Pitch
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {pitches.map((pitch) => {
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

              return (
                <ScrollReveal key={pitch.id} direction="up" delay={0.05}>
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 hover:border-gray-300 transition duration-150">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${typeColor}`}>
                            {typeLabel}
                          </span>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {pitch.stage}
                          </span>
                          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                            {pitch.sector}
                          </span>
                          {pitch.pitchDeckUrl && (
                            <a
                              href={pitch.pitchDeckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-100 transition"
                              title="View Pitch Deck"
                            >
                              <FileText size={12} />
                              <span>Deck</span>
                            </a>
                          )}
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-[#172033] leading-snug">
                          {pitch.title}
                        </h3>
                        {pitch.tagline && (
                          <p className="mt-0.5 text-xs font-medium text-[#2563EB]">
                            {pitch.tagline}
                          </p>
                        )}
                      </div>

                      {/* Financial ask / Terms & Preview button */}
                      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <div className="text-left sm:text-right">
                          {pitch.targetAmount && (
                            <div className="flex sm:flex-col items-baseline sm:items-end gap-1.5 sm:gap-0">
                              <span className="text-[10px] uppercase font-bold text-[#64748B]">Target Raise</span>
                              <span className="text-base font-extrabold text-[#172033]">{formatTargetAmount(pitch.targetAmount)}</span>
                            </div>
                          )}
                          {pitch.equityOffered && (
                            <span className="text-xs font-bold text-[#2563EB] mt-0.5 block">
                              Terms: {pitch.equityOffered}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewingPitch(pitch)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-blue-50/60 transition"
                        >
                          <Eye size={13} />
                          <span>Preview Pitch</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary with ReadMore action that opens full preview */}
                    <div className="mt-3">
                      {pitch.summary && pitch.summary.length > 180 ? (
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          <span>{pitch.summary.slice(0, 180).trimEnd()}… </span>
                          <button
                            type="button"
                            onClick={() => setPreviewingPitch(pitch)}
                            className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:text-[#1E3A5F] hover:underline"
                          >
                            Read more
                          </button>
                        </p>
                      ) : (
                        <p className="text-xs text-[#64748B] leading-relaxed">{pitch.summary}</p>
                      )}
                    </div>

                    {/* 3 WORKFLOW METRIC TILES */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Metric 1: Investor Views */}
                      <button
                        onClick={() => setViewingInvestorsForPitch(pitch)}
                        className="rounded-xl border border-[#E5E7EB] bg-[#EFF6FF] p-3 text-left transition hover:bg-blue-100/60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1E3A5F] flex items-center gap-1.5">
                            <Eye size={14} className="text-[#2563EB]" /> Investor Views
                          </span>
                          <ChevronRight size={14} className="text-[#2563EB]" />
                        </div>
                        <p className="mt-1 text-lg font-black text-[#172033]">
                          {pitch.viewCount || 0}
                          <span className="text-xs font-semibold text-[#2563EB] ml-1.5">Investors</span>
                        </p>
                        <span className="text-[10px] text-[#64748B]">Click to view who looked</span>
                      </button>

                      {/* Metric 2: Offers Received */}
                      <button
                        onClick={() => setViewingOffersForPitch(pitch)}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F8F4E8] p-3 text-left transition hover:bg-[#F2ECE0]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#172033] flex items-center gap-1.5">
                            <DollarSign size={14} className="text-[#2563EB]" /> Offers Received
                          </span>
                          <ChevronRight size={14} className="text-[#64748B]" />
                        </div>
                        <p className="mt-1 text-lg font-black text-[#172033]">
                          {pitch.offerCount || 0}
                          <span className="text-xs font-semibold text-[#64748B] ml-1.5">
                            (${Number(pitch.totalOfferAmount || 0).toLocaleString()} offered)
                          </span>
                        </p>
                        <span className="text-[10px] text-[#64748B]">Click to review terms</span>
                      </button>

                      {/* Metric 3: Investor Ratings out of 5 */}
                      <button
                        onClick={() => setViewingRatingsForPitch(pitch)}
                        className="rounded-xl border border-[#E5E7EB] bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#172033] flex items-center gap-1.5">
                            <Star size={14} className="text-[#2563EB] fill-[#2563EB]" /> Pitch Rating
                          </span>
                          <ChevronRight size={14} className="text-[#64748B]" />
                        </div>
                        <p className="mt-1 text-lg font-black text-[#172033]">
                          {Number(pitch.averageRating || 0).toFixed(1)} / 5.0
                          <span className="text-xs font-semibold text-[#64748B] ml-1.5">
                            ({pitch.ratingCount || 0} ratings)
                          </span>
                        </p>
                        <span className="text-[10px] text-[#64748B]">Out of 5 from verified investors</span>
                      </button>
                    </div>

                    {/* BRANCH 2: Option to ask for help in building with other companies */}
                    <div className="mt-5 border-t border-[#E5E7EB] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {pitch.isSharedWithCompanies ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#2563EB] border border-blue-200">
                              <CheckCircle2 size={14} className="text-[#2563EB]" />
                              Open for Company Collaboration
                            </span>
                            {pitch.feedPostId && (
                              <Link
                                href={`/explore`}
                                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                              >
                                View in Feed <ExternalLink size={12} />
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-[#64748B]">
                            <span className="font-semibold text-[#172033]">🔒 Confidential to Investors only.</span>{" "}
                            Other companies cannot see this idea unless you choose to ask for co-building help.
                          </div>
                        )}
                      </div>

                      <div>
                        {pitch.isSharedWithCompanies ? (
                          <span className="text-xs text-[#2563EB] font-semibold flex items-center gap-1">
                            <Handshake size={14} /> Companies can discover & offer help
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmingSharePitch(pitch)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition"
                          >
                            <Handshake size={15} />
                            <span>Ask for Help in Building with Other Companies</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR ASKING HELP / SHARING WITH COMPANIES */}
      {confirmingSharePitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 shrink-0">
                <Handshake className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  Ask for Help Building with Other Companies?
                </h3>
                <p className="mt-1 text-xs text-gray-500 font-medium">
                  Project: <strong className="text-gray-900">{confirmingSharePitch.title}</strong>
                </p>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <ShieldAlert size={15} className="text-amber-600 shrink-0" />
                    Why is this not enabled by default?
                  </p>
                  <p className="leading-relaxed text-amber-800/90">
                    Many businesses prefer to keep their pitch confidential and only visible to vetted investors. When no investors have invested yet, or when you need co-founders, technical partners, or supplier teams to help build your idea, you can publish it directly to the community feed.
                  </p>
                </div>

                <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                  Clicking <strong>&ldquo;Publish to Companies&rdquo;</strong> will create a post on the community feed and open a collaboration request so other companies can step up and help build this idea.
                </p>

                <div className="mt-6 flex justify-end gap-2.5">
                  <button
                    disabled={sharingLoading}
                    onClick={() => setConfirmingSharePitch(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={sharingLoading}
                    onClick={() => handleShareCollaboration(confirmingSharePitch)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    {sharingLoading && <Loader2 size={14} className="animate-spin" />}
                    Publish & Ask for Help
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW INVESTORS WHO VIEWED THE PITCH */}
      {viewingInvestorsForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Investors Who Viewed This Pitch
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{viewingInvestorsForPitch.title}</p>
              </div>
              <button onClick={() => setViewingInvestorsForPitch(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2.5">
              {viewingInvestorsForPitch.views?.length > 0 ? (
                viewingInvestorsForPitch.views.map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                        {v.image ? <img src={v.image} alt={v.name} className="h-full w-full object-cover" /> : v.name?.charAt(0) || "I"}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-gray-900">{v.name}</h4>
                        <p className="text-[11px] text-gray-500">{v.firmName || v.investorType || "Verified Investor"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(v.viewedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-500">
                  No investor views tracked on this pitch yet.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingInvestorsForPitch(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW OFFERS RECEIVED AND CAPITAL TOTAL */}
      {viewingOffersForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Investment Offers ({viewingOffersForPitch.offers?.length || 0})
                </h3>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Total Capital Offered: ${Number(viewingOffersForPitch.totalOfferAmount || 0).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setViewingOffersForPitch(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {viewingOffersForPitch.offers?.length > 0 ? (
                viewingOffersForPitch.offers.map((offer) => (
                  <div key={offer.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-sm">
                          {offer.image ? <img src={offer.image} alt={offer.name} className="h-full w-full object-cover" /> : offer.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{offer.name}</h4>
                          <p className="text-xs text-gray-500">{offer.firmName || offer.investorType || "Investor"}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-700">{offer.amount}</span>
                        <span className="block text-[11px] font-semibold text-gray-500">{offer.terms}</span>
                      </div>
                    </div>

                    {offer.message && (
                      <p className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-700 leading-relaxed italic">
                        &ldquo;{offer.message}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${offer.status === "ACCEPTED"
                        ? "bg-emerald-100 text-emerald-800"
                        : offer.status === "DECLINED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                        }`}>
                        Status: {offer.status}
                      </span>

                      {offer.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={respondingOfferId === offer.id}
                            onClick={() => handleOfferResponse(offer.id, "DECLINED")}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                          >
                            Decline
                          </button>
                          <button
                            disabled={respondingOfferId === offer.id}
                            onClick={() => handleOfferResponse(offer.id, "ACCEPTED")}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            Accept Offer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-500">
                  No investment offers received on this pitch yet.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingOffersForPitch(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PITCH PREVIEW MODAL */}
      {previewingPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-3xl sm:max-w-4xl max-h-[92vh] rounded-2xl bg-white border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-white shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${previewingPitch.type === "PITCH"
                    ? "bg-[#EFF6FF] text-[#2563EB] border-blue-200"
                    : previewingPitch.type === "PRODUCT"
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}>
                    {previewingPitch.type === "PITCH" ? "Pitch Deck" : previewingPitch.type === "PRODUCT" ? "Live Product" : "Early Idea"}
                  </span>
                  <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {previewingPitch.stage}
                  </span>
                  <span className="rounded-md bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600 border border-gray-200/60">
                    {previewingPitch.sector}
                  </span>
                  {previewingPitch.isSharedWithCompanies ? (
                    <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB] border border-blue-200">
                      Collaboration Enabled
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                      Investor Confidential
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
                  {previewingPitch.title}
                </h2>
                {previewingPitch.tagline && (
                  <p className="text-xs sm:text-sm font-semibold text-[#2563EB]">
                    {previewingPitch.tagline}
                  </p>
                )}
              </div>

              <button
                onClick={() => setPreviewingPitch(null)}
                className="rounded-full p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Financial Ask & Valuation Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[#E5E7EB] bg-[#EFF6FF] p-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Target Raise</span>
                  <span className="text-xl font-black text-[#172033]">
                    {previewingPitch.targetAmount ? formatTargetAmount(previewingPitch.targetAmount) : "Not Specified"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Terms Offered</span>
                  <span className="text-base font-bold text-[#2563EB]">
                    {previewingPitch.equityOffered || "Standard Equity"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Offers Received</span>
                  <span className="text-base font-black text-[#172033]">
                    {previewingPitch.offerCount || 0} Offers
                    <span className="text-xs font-semibold text-[#64748B] ml-1 block">
                      (${Number(previewingPitch.totalOfferAmount || 0).toLocaleString()} offered)
                    </span>
                  </span>
                </div>
              </div>

              {/* Full Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Pitch Summary & Description
                </h3>
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-[#172033] whitespace-pre-wrap">
                  {previewingPitch.summary}
                </div>
              </div>

              {/* Highlights */}
              {previewingPitch.highlights && previewingPitch.highlights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Key Highlights & Traction
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewingPitch.highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#172033]">
                        <CheckCircle2 size={15} className="text-[#2563EB] shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {(previewingPitch.pitchDeckUrl || previewingPitch.websiteUrl) && (
                <div className="flex flex-wrap gap-3">
                  {previewingPitch.pitchDeckUrl && (
                    <a
                      href={previewingPitch.pitchDeckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition"
                    >
                      <ExternalLink size={13} /> View Pitch Deck
                    </a>
                  )}
                  {previewingPitch.websiteUrl && (
                    <a
                      href={previewingPitch.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ExternalLink size={13} /> Company Website
                    </a>
                  )}
                </div>
              )}

              {/* RECEIVED INVESTMENT OFFERS SECTION WITH ACCEPT / DECLINE BUTTONS */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Received Investment Offers ({previewingPitch.offers?.length || 0})
                  </h3>
                  <span className="text-xs font-bold text-emerald-700">
                    Total: ${Number(previewingPitch.totalOfferAmount || 0).toLocaleString()}
                  </span>
                </div>

                {previewingPitch.offers && previewingPitch.offers.length > 0 ? (
                  <div className="space-y-3">
                    {previewingPitch.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-sm shrink-0">
                              {offer.image ? (
                                <img src={offer.image} alt={offer.name} className="h-full w-full object-cover" />
                              ) : (
                                offer.name?.charAt(0) || "I"
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{offer.name}</h4>
                              <p className="text-xs text-gray-500">
                                {offer.firmName || offer.investorType || "Verified Investor"}
                              </p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-base font-black text-emerald-700 block">
                              {offer.amount}
                            </span>
                            <span className="text-xs font-semibold text-gray-600">
                              {offer.terms}
                            </span>
                          </div>
                        </div>

                        {offer.message && (
                          <p className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-700 italic border border-gray-100">
                            &ldquo;{offer.message}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <span
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${offer.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : offer.status === "DECLINED"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                          >
                            Status: {offer.status}
                          </span>

                          {offer.status === "PENDING" && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={respondingOfferId === offer.id}
                                onClick={() => handleOfferResponse(offer.id, "DECLINED")}
                                className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                disabled={respondingOfferId === offer.id}
                                onClick={() => handleOfferResponse(offer.id, "ACCEPTED")}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                              >
                                {respondingOfferId === offer.id && (
                                  <Loader2 size={12} className="animate-spin" />
                                )}
                                Accept Offer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500">
                    No investment offers have been received on this pitch yet. Offers submitted by verified investors will appear here with terms and accept/decline actions.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-500">
                Created: {new Date(previewingPitch.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {!previewingPitch.isSharedWithCompanies && (
                  <button
                    type="button"
                    onClick={() => {
                      const pitch = previewingPitch;
                      setPreviewingPitch(null);
                      setConfirmingSharePitch(pitch);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition"
                  >
                    <Handshake size={14} /> Ask for Help Building
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewingPitch(null)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PITCH RATINGS (OUT OF 5 HOW MANY INVESTORS ARE RATING) */}
      {viewingRatingsForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Investor Ratings ({viewingRatingsForPitch.ratingCount || 0})
                </h3>
                <p className="text-xs text-amber-800 font-semibold mt-0.5">
                  Average Score: {Number(viewingRatingsForPitch.averageRating || 0).toFixed(1)} out of 5 stars
                </p>
              </div>
              <button onClick={() => setViewingRatingsForPitch(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
              {viewingRatingsForPitch.ratings?.length > 0 ? (
                viewingRatingsForPitch.ratings.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-gray-900">{r.investorName}</h4>
                        <p className="text-[10px] text-gray-500">{r.firmName || r.investorType || "Verified Investor"}</p>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= r.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}
                          />
                        ))}
                        <span className="ml-1 text-xs font-bold text-gray-800">{r.rating}/5</span>
                      </div>
                    </div>

                    {r.feedback && (
                      <p className="text-xs text-gray-600 italic">
                        &ldquo;{r.feedback}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-500">
                  No ratings submitted by investors yet.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingRatingsForPitch(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pitch Modal */}
      {showAddModal && (
        <AddPitchModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchPitches();
          }}
        />
      )}
    </div>
  );
}
