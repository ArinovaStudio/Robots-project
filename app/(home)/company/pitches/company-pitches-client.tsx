
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  Eye,
  DollarSign,
  Star,
  Handshake,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ChevronRight,
  FileText,
  Pencil,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import AddPitchModal from "@/components/modals/add-pitch-modal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatTargetAmount } from "@/lib/utils";

export interface PitchData {
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

const PUBLISH_GUIDELINES = [
  "I confirm that all information provided in this pitch is accurate and not misleading.",
  "I confirm that I have the necessary rights and authorization to share the submitted content.",
  "I understand that my published pitch may be visible to investors and other eligible platform users.",
  "I acknowledge that publishing a pitch does not guarantee funding, investment, or partnership opportunities.",
];

export default function CompanyPitchesClient() {
  const [pitches, setPitches] = useState<PitchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPitch, setEditingPitch] = useState<PitchData | null>(null);

  // Three-dot menu
  const [openMenuPitchId, setOpenMenuPitchId] = useState<string | null>(null);

  // Modals for details
  const [viewingInvestorsForPitch, setViewingInvestorsForPitch] =
    useState<PitchData | null>(null);
  const [viewingOffersForPitch, setViewingOffersForPitch] =
    useState<PitchData | null>(null);
  const [viewingRatingsForPitch, setViewingRatingsForPitch] =
    useState<PitchData | null>(null);
  const [previewingPitch, setPreviewingPitch] =
    useState<PitchData | null>(null);
  const [confirmingSharePitch, setConfirmingSharePitch] =
    useState<PitchData | null>(null);

  const [sharingLoading, setSharingLoading] = useState(false);
  const [confirmingUnpublishPitch, setConfirmingUnpublishPitch] =
    useState<PitchData | null>(null);
  const [unpublishingLoading, setUnpublishingLoading] = useState(false);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(
    null
  );
  const [deletingPitchId, setDeletingPitchId] = useState<string | null>(null);

  const fetchPitches = async () => {
    try {
      const res = await fetch("/api/company/pitches");
      const json = await res.json();

      if (json.success) {
        setPitches(json.data);
      } else {
        toast.error(json.message || "Failed to load pitches.");
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

  // Close the three-dot menu when the user clicks/taps outside any pitch menu.
  useEffect(() => {
    if (!openMenuPitchId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("[data-pitch-menu]")) {
        setOpenMenuPitchId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuPitchId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuPitchId]);

  // Publish pitch for company collaboration
  const handleShareCollaboration = async (pitch: PitchData) => {
    setSharingLoading(true);

    try {
      const res = await fetch(
        `/api/company/pitches/${pitch.id}/share-collaboration`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Pitch published successfully.");

        setConfirmingSharePitch(null);

        await fetchPitches();
      } else {
        toast.error(data.message || "Could not publish for collaboration.");
      }
    } catch {
      toast.error("An error occurred while publishing.");
    } finally {
      setSharingLoading(false);
    }
  };

  // Unpublish a pitch from investor discovery and the public feed.
  const handleUnpublishPitch = async (pitch: PitchData) => {
    setUnpublishingLoading(true);
    try {
      const res = await fetch(
        `/api/company/pitches/${pitch.id}/share-collaboration`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Pitch unpublished successfully.");
        setConfirmingUnpublishPitch(null);
        await fetchPitches();
      } else {
        toast.error(data.message || "Could not unpublish this pitch.");
      }
    } catch {
      toast.error("An error occurred while unpublishing the pitch.");
    } finally {
      setUnpublishingLoading(false);
    }
  };

  // Delete pitch
  const handleDeletePitch = async (pitch: PitchData) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${pitch.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingPitchId(pitch.id);
    setOpenMenuPitchId(null);

    try {
      const res = await fetch(`/api/company/pitches/${pitch.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Pitch deleted successfully.");

        setPitches((prev) => prev.filter((p) => p.id !== pitch.id));

        if (previewingPitch?.id === pitch.id) {
          setPreviewingPitch(null);
        }

        if (viewingOffersForPitch?.id === pitch.id) {
          setViewingOffersForPitch(null);
        }

        if (viewingInvestorsForPitch?.id === pitch.id) {
          setViewingInvestorsForPitch(null);
        }

        if (viewingRatingsForPitch?.id === pitch.id) {
          setViewingRatingsForPitch(null);
        }
      } else {
        toast.error(data.message || "Failed to delete pitch.");
      }
    } catch {
      toast.error("An error occurred while deleting the pitch.");
    } finally {
      setDeletingPitchId(null);
    }
  };

  // Accept / decline investment offer
  const handleOfferResponse = async (
    offerId: string,
    action: "ACCEPTED" | "DECLINED"
  ) => {
    setRespondingOfferId(offerId);

    try {
      const res = await fetch(`/api/company/pitches/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message);

        await fetchPitches();

        if (viewingOffersForPitch) {
          setViewingOffersForPitch((prev) => {
            if (!prev) return null;

            return {
              ...prev,
              offers: prev.offers.map((o) =>
                o.id === offerId ? { ...o, status: action } : o
              ),
            };
          });
        }

        if (previewingPitch) {
          setPreviewingPitch((prev) => {
            if (!prev) return null;

            return {
              ...prev,
              offers: prev.offers.map((o) =>
                o.id === offerId ? { ...o, status: action } : o
              ),
            };
          });
        }
      } else {
        toast.error(data.message || "Failed to update offer.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setRespondingOfferId(null);
    }
  };

  const totalViews = pitches.reduce(
    (sum, p) => sum + (p.viewCount || 0),
    0
  );

  const totalOfferedAmount = pitches.reduce(
    (sum, p) => sum + (p.totalOfferAmount || 0),
    0
  );

  const totalRatings = pitches.reduce(
    (sum, p) => sum + (p.ratingCount || 0),
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      {/* GLOBAL STATS */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-3.5 border border-[#E5E7EB]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Pitches
            </span>
            <p className="text-2xl font-black text-[#172033] mt-0.5">
              {pitches.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-[#E5E7EB]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Investor Views
            </span>
            <p className="text-2xl font-black text-[#172033] mt-0.5">
              {totalViews}
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-[#E5E7EB]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Capital Offered
            </span>
            <p className="text-2xl font-black text-[#172033] mt-0.5">
              ${totalOfferedAmount.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-[#E5E7EB]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Investor Ratings
            </span>
            <p className="text-2xl font-black text-[#2563EB] mt-0.5">
              {totalRatings} ratings
            </p>
          </div>
        </div>
      </div>

      {/* PITCHES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#172033]">
            Your Active Pitches & Opportunities
          </h2>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shrink-0"
          >
            <PlusCircle size={16} />
            <span>Add New Pitch</span>
          </button>
        </div>

        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4"
                >
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

            <h3 className="text-base font-bold text-gray-800">
              You haven&apos;t added any pitches yet
            </h3>

            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Share your startup ideas, live products, or investment proposals
              to connect with active angel and VC investors.
            </p>

            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <PlusCircle size={15} />
              Add Your First Pitch
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
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${typeColor}`}
                          >
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

                      {/* TARGET RAISE + THREE DOT MENU */}
                      <div className="flex items-start justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-left sm:text-right">
                          {pitch.targetAmount && (
                            <div className="flex sm:flex-col items-baseline sm:items-end gap-1.5 sm:gap-0">
                              <span className="text-[10px] uppercase font-bold text-[#64748B]">
                                Target Raise
                              </span>

                              <span className="text-base font-extrabold text-[#172033]">
                                {formatTargetAmount(pitch.targetAmount)}
                              </span>
                            </div>
                          )}

                          {pitch.equityOffered && (
                            <span className="text-xs font-bold text-[#2563EB] mt-0.5 block">
                              Terms: {pitch.equityOffered}
                            </span>
                          )}
                        </div>

                        {/* THREE DOT MENU */}
                        <div className="relative" data-pitch-menu>
                          <button
                            type="button"
                            disabled={deletingPitchId === pitch.id}
                            onClick={() =>
                              setOpenMenuPitchId((prev) =>
                                prev === pitch.id ? null : pitch.id
                              )
                            }
                            className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-50"
                            aria-label="Pitch actions"
                            aria-expanded={openMenuPitchId === pitch.id}
                          >
                            <MoreVertical size={19} />
                          </button>

                          {openMenuPitchId === pitch.id && (
                            <div className="absolute right-0 top-full mt-2 z-40 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                              {/* EDIT */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuPitchId(null);
                                  setEditingPitch(pitch);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                              >
                                <Pencil size={15} />
                                Edit Pitch
                              </button>

                              {/* PREVIEW */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuPitchId(null);
                                  setPreviewingPitch(pitch);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                              >
                                <Eye size={15} />
                                Preview Pitch
                              </button>

                              <div className="my-1 border-t border-gray-100" />

                              {/* DELETE */}
                              <button
                                type="button"
                                onClick={() => handleDeletePitch(pitch)}
                                disabled={deletingPitchId === pitch.id}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              >
                                {deletingPitchId === pitch.id ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                                Delete Pitch
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SUMMARY */}
                    <div className="mt-3">
                      {pitch.summary && pitch.summary.length > 180 ? (
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          <span>
                            {pitch.summary.slice(0, 180).trimEnd()}…
                          </span>{" "}
                          <button
                            type="button"
                            onClick={() => setPreviewingPitch(pitch)}
                            className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:text-[#1E3A5F] hover:underline"
                          >
                            Read more
                          </button>
                        </p>
                      ) : (
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {pitch.summary}
                        </p>
                      )}
                    </div>

                    {/* WORKFLOW METRICS */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* INVESTOR VIEWS */}
                      <button
                        onClick={() => setViewingInvestorsForPitch(pitch)}
                        className="rounded-xl border border-[#E5E7EB] bg-[#EFF6FF] p-3 text-left transition hover:bg-blue-100/60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1E3A5F] flex items-center gap-1.5">
                            <Eye size={14} className="text-[#2563EB]" />
                            Investor Views
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-[#2563EB]"
                          />
                        </div>

                        <p className="mt-1 text-lg font-black text-[#172033]">
                          {pitch.viewCount || 0}
                          <span className="text-xs font-semibold text-[#2563EB] ml-1.5">
                            Investors
                          </span>
                        </p>

                        <span className="text-[10px] text-[#64748B]">
                          Click to view who looked
                        </span>
                      </button>

                      {/* OFFERS */}
                      <button
                        onClick={() => setViewingOffersForPitch(pitch)}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F8F4E8] p-3 text-left transition hover:bg-[#F2ECE0]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#172033] flex items-center gap-1.5">
                            <DollarSign
                              size={14}
                              className="text-[#2563EB]"
                            />
                            Offers Received
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-[#64748B]"
                          />
                        </div>

                        <p className="mt-1 text-lg font-black text-[#172033]">
                          {pitch.offerCount || 0}
                          <span className="text-xs font-semibold text-[#64748B] ml-1.5">
                            (${Number(
                              pitch.totalOfferAmount || 0
                            ).toLocaleString()}{" "}
                            offered)
                          </span>
                        </p>

                        <span className="text-[10px] text-[#64748B]">
                          Click to review terms
                        </span>
                      </button>

                      {/* RATINGS */}
                      <button
                        onClick={() => setViewingRatingsForPitch(pitch)}
                        className="rounded-xl border border-[#E5E7EB] bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#172033] flex items-center gap-1.5">
                            <Star
                              size={14}
                              className="text-[#2563EB] fill-[#2563EB]"
                            />
                            Pitch Rating
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-[#64748B]"
                          />
                        </div>

                        <p className="mt-1 text-lg font-black text-[#172033]">
                          {Number(pitch.averageRating || 0).toFixed(1)} / 5.0
                          <span className="text-xs font-semibold text-[#64748B] ml-1.5">
                            ({pitch.ratingCount || 0} ratings)
                          </span>
                        </p>

                        <span className="text-[10px] text-[#64748B]">
                          Out of 5 from verified investors
                        </span>
                      </button>
                    </div>

                    {/* COMPANY COLLABORATION */}
                    <div className="mt-5 border-t border-[#E5E7EB] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {pitch.isSharedWithCompanies ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2
                                size={14}
                                className="text-emerald-600"
                              />
                              Published
                            </span>

                            {pitch.feedPostId && (
                              <Link
                                href="/explore"
                                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                              >
                                View in Feed
                                <ExternalLink size={12} />
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-[#64748B]">
                            <span className="font-semibold text-[#172033]">
                              🔒 Confidential to Investors only.
                            </span>{" "}
                            Other companies cannot see this idea unless you
                            choose to ask for co-building help.
                          </div>
                        )}
                      </div>

                      <div>
                        {pitch.isSharedWithCompanies ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingUnpublishPitch(pitch)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                          >
                            <XCircle size={15} />
                            <span>Unpublish</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingSharePitch(pitch)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition"
                          >
                            <Handshake size={15} />
                            <span>Publish my pitch</span>
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

      {/* PUBLISH PITCH GUIDELINES MODAL */}
      {confirmingSharePitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 border border-gray-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* HEADER */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 shrink-0">
                <Handshake className="w-7 h-7" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  Publish Your Pitch
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Project:{" "}
                  <strong className="text-gray-900">
                    {confirmingSharePitch.title}
                  </strong>
                </p>
              </div>
            </div>

            {/* GUIDELINES */}
            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">
                Before publishing, please confirm the following:
              </h4>

              {PUBLISH_GUIDELINES.map((guideline, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {index + 1}
                  </span>

                  <p className="text-xs leading-relaxed text-gray-700">
                    {guideline}
                  </p>
                </div>
              ))}
            </div>

            {/* WARNING */}
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldAlert
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="text-xs leading-relaxed text-amber-800">
                  By clicking Publish Now, you acknowledge the above
                  guidelines. Your pitch will be published for eligible
                  platform users to discover.
                </p>
              </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={sharingLoading}
                onClick={() => setConfirmingSharePitch(null)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={sharingLoading}
                onClick={() =>
                  handleShareCollaboration(confirmingSharePitch)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {sharingLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Publish Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNPUBLISH CONFIRMATION MODAL */}
      {confirmingUnpublishPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-gray-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  Unpublish this pitch?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  <strong>{confirmingUnpublishPitch.title}</strong> will no
                  longer appear in investor/company collaboration discovery.
                  Its linked collaboration request will be closed. Your pitch
                  and existing investor offers, views, and ratings will remain
                  in your account.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={unpublishingLoading}
                onClick={() => setConfirmingUnpublishPitch(null)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={unpublishingLoading}
                onClick={() => handleUnpublishPitch(confirmingUnpublishPitch)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {unpublishingLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Unpublishing...
                  </>
                ) : (
                  <>
                    <XCircle size={15} />
                    Yes, Unpublish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVESTOR VIEWS MODAL */}
      {viewingInvestorsForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Investors Who Viewed This Pitch
                </h3>

                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                  {viewingInvestorsForPitch.title}
                </p>
              </div>

              <button
                onClick={() => setViewingInvestorsForPitch(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2.5">
              {viewingInvestorsForPitch.views?.length > 0 ? (
                viewingInvestorsForPitch.views.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                        {v.image ? (
                          <img
                            src={v.image}
                            alt={v.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          v.name?.charAt(0) || "I"
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-gray-900">
                          {v.name}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          {v.firmName || v.investorType || "Verified Investor"}
                        </p>
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

      {/* INVESTMENT OFFERS MODAL */}
      {viewingOffersForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Investment Offers (
                  {viewingOffersForPitch.offers?.length || 0})
                </h3>

                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Total Capital Offered: $
                  {Number(
                    viewingOffersForPitch.totalOfferAmount || 0
                  ).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setViewingOffersForPitch(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {viewingOffersForPitch.offers?.length > 0 ? (
                viewingOffersForPitch.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-sm">
                          {offer.image ? (
                            <img
                              src={offer.image}
                              alt={offer.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            offer.name?.charAt(0)
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-gray-900">
                            {offer.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {offer.firmName || offer.investorType || "Investor"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-700">
                          {offer.amount}
                        </span>
                        <span className="block text-[11px] font-semibold text-gray-500">
                          {offer.terms}
                        </span>
                      </div>
                    </div>

                    {offer.message && (
                      <p className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-700 leading-relaxed italic">
                        &ldquo;{offer.message}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          offer.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : offer.status === "DECLINED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Status: {offer.status}
                      </span>

                      {offer.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={respondingOfferId === offer.id}
                            onClick={() =>
                              handleOfferResponse(offer.id, "DECLINED")
                            }
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                          >
                            Decline
                          </button>

                          <button
                            disabled={respondingOfferId === offer.id}
                            onClick={() =>
                              handleOfferResponse(offer.id, "ACCEPTED")
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
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
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-white shrink-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      previewingPitch.type === "PITCH"
                        ? "bg-[#EFF6FF] text-[#2563EB] border-blue-200"
                        : previewingPitch.type === "PRODUCT"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {previewingPitch.type === "PITCH"
                      ? "Pitch Deck"
                      : previewingPitch.type === "PRODUCT"
                        ? "Live Product"
                        : "Early Idea"}
                  </span>

                  <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {previewingPitch.stage}
                  </span>

                  <span className="rounded-md bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600 border border-gray-200/60">
                    {previewingPitch.sector}
                  </span>

                  {previewingPitch.isSharedWithCompanies ? (
                    <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      Published
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

            {/* SCROLLABLE BODY */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* FINANCIAL DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[#E5E7EB] bg-[#EFF6FF] p-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Target Raise
                  </span>
                  <span className="text-xl font-black text-[#172033]">
                    {previewingPitch.targetAmount
                      ? formatTargetAmount(previewingPitch.targetAmount)
                      : "Not Specified"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Terms Offered
                  </span>
                  <span className="text-base font-bold text-[#2563EB]">
                    {previewingPitch.equityOffered || "Standard Equity"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Offers Received
                  </span>
                  <span className="text-base font-black text-[#172033]">
                    {previewingPitch.offerCount || 0} Offers
                    <span className="text-xs font-semibold text-[#64748B] ml-1 block">
                      ($
                      {Number(
                        previewingPitch.totalOfferAmount || 0
                      ).toLocaleString()}{" "}
                      offered)
                    </span>
                  </span>
                </div>
              </div>

              {/* FULL SUMMARY */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Pitch Summary & Description
                </h3>

                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-[#172033] whitespace-pre-wrap">
                  {previewingPitch.summary}
                </div>
              </div>

              {/* HIGHLIGHTS */}
              {previewingPitch.highlights &&
                previewingPitch.highlights.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Key Highlights & Traction
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {previewingPitch.highlights.map((hl, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-[#172033]"
                        >
                          <CheckCircle2
                            size={15}
                            className="text-[#2563EB] shrink-0 mt-0.5"
                          />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* EXTERNAL LINKS */}
              {(previewingPitch.pitchDeckUrl ||
                previewingPitch.websiteUrl) && (
                <div className="flex flex-wrap gap-3">
                  {previewingPitch.pitchDeckUrl && (
                    <a
                      href={previewingPitch.pitchDeckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition"
                    >
                      <ExternalLink size={13} />
                      View Pitch Deck
                    </a>
                  )}

                  {previewingPitch.websiteUrl && (
                    <a
                      href={previewingPitch.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ExternalLink size={13} />
                      Company Website
                    </a>
                  )}
                </div>
              )}

              {/* RECEIVED INVESTMENT OFFERS */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Received Investment Offers (
                    {previewingPitch.offers?.length || 0})
                  </h3>

                  <span className="text-xs font-bold text-emerald-700">
                    Total: $
                    {Number(
                      previewingPitch.totalOfferAmount || 0
                    ).toLocaleString()}
                  </span>
                </div>

                {previewingPitch.offers &&
                previewingPitch.offers.length > 0 ? (
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
                                <img
                                  src={offer.image}
                                  alt={offer.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                offer.name?.charAt(0) || "I"
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-gray-900">
                                {offer.name}
                              </h4>

                              <p className="text-xs text-gray-500">
                                {offer.firmName ||
                                  offer.investorType ||
                                  "Verified Investor"}
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
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                              offer.status === "ACCEPTED"
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
                                onClick={() =>
                                  handleOfferResponse(
                                    offer.id,
                                    "DECLINED"
                                  )
                                }
                                className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                              >
                                Decline
                              </button>

                              <button
                                type="button"
                                disabled={respondingOfferId === offer.id}
                                onClick={() =>
                                  handleOfferResponse(
                                    offer.id,
                                    "ACCEPTED"
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                              >
                                {respondingOfferId === offer.id && (
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                  />
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
                    No investment offers have been received on this pitch
                    yet. Offers submitted by verified investors will appear
                    here with terms and accept/decline actions.
                  </div>
                )}
              </div>
            </div>

            {/* PREVIEW FOOTER */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-500">
                Created:{" "}
                {new Date(
                  previewingPitch.createdAt
                ).toLocaleDateString()}
              </span>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pitch = previewingPitch;
                    setPreviewingPitch(null);
                    setEditingPitch(pitch);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  <Pencil size={14} />
                  Edit Pitch
                </button>

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
                    <Handshake size={14} />
                    Ask for Help Building
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

      {/* INVESTOR RATINGS MODAL */}
      {viewingRatingsForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Investor Ratings (
                  {viewingRatingsForPitch.ratingCount || 0})
                </h3>

                <p className="text-xs text-amber-800 font-semibold mt-0.5">
                  Average Score:{" "}
                  {Number(
                    viewingRatingsForPitch.averageRating || 0
                  ).toFixed(1)}{" "}
                  out of 5 stars
                </p>
              </div>

              <button
                onClick={() => setViewingRatingsForPitch(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
              {viewingRatingsForPitch.ratings?.length > 0 ? (
                viewingRatingsForPitch.ratings.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-gray-900">
                          {r.investorName}
                        </h4>

                        <p className="text-[10px] text-gray-500">
                          {r.firmName ||
                            r.investorType ||
                            "Verified Investor"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= r.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-gray-300"
                            }
                          />
                        ))}

                        <span className="ml-1 text-xs font-bold text-gray-800">
                          {r.rating}/5
                        </span>
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

      {/* ADD / EDIT PITCH MODAL */}
      {(showAddModal || editingPitch) && (
        <AddPitchModal
          pitch={editingPitch}
          onClose={() => {
            setShowAddModal(false);
            setEditingPitch(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingPitch(null);
            fetchPitches();
          }}
        />
      )}
    </div>
  );
}
