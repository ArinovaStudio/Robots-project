"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FileText, Handshake, MapPin, Search, Send, Star, Users } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import RatePitchModal from "@/components/modals/rate-pitch-modal";
import MakeOfferModal from "@/components/modals/make-offer-modal";
import CompanyPitchDetailsModal, {
  PITCH_TYPE_LABEL,
  type CompanyPitchDetails,
} from "@/components/modals/company-pitch-details-modal";
import { formatTargetAmount } from "@/lib/utils";

type PitchType = "PITCH" | "PRODUCT" | "IDEA";

interface CompanyPitch extends CompanyPitchDetails {
  company: CompanyPitchDetails["company"] & {
    logoUrl: string | null;
  };
  userFeedback?: string | null;
}

const TYPE_FILTERS: { value: "ALL" | PitchType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PITCH", label: "Formal pitch" },
  { value: "PRODUCT", label: "Live product" },
  { value: "IDEA", label: "Early idea" },
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
];

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function CompanyPitchesClient() {
  const [pitches, setPitches] = useState<CompanyPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | PitchType>("ALL");

  const [detailsTarget, setDetailsTarget] = useState<CompanyPitch | null>(null);
  const [rateTarget, setRateTarget] = useState<CompanyPitch | null>(null);
  const [offerTarget, setOfferTarget] = useState<CompanyPitch | null>(null);

  const fetchPitches = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await fetch("/api/investor/pitches");
      const json = await res.json();
      if (json.success) {
        setPitches(json.data);
      } else {
        toast.error(json.message || "Failed to load company pitches");
      }
    } catch {
      toast.error("Failed to load company pitches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPitches();
  }, [fetchPitches]);

  const recordView = (pitchId: string) => {
    fetch(`/api/investor/pitches/${pitchId}/view`, { method: "POST" }).catch(() => {});
  };

  const sectors = useMemo(
    () => Array.from(new Set(pitches.map((p) => p.sector).filter(Boolean))).sort(),
    [pitches]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pitches.filter((p) => {
      if (typeFilter !== "ALL" && p.type !== typeFilter) return false;
      if (sector !== "ALL" && p.sector !== sector) return false;
      if (!q) return true;
      return [p.title, p.tagline, p.summary, p.sector, p.company.companyName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [pitches, search, sector, typeFilter]);

  const openDetails = (pitch: CompanyPitch) => {
    recordView(pitch.id);
    setDetailsTarget(pitch);
  };

  const openRate = (pitch: CompanyPitch) => {
    recordView(pitch.id);
    setDetailsTarget(null);
    setRateTarget(pitch);
  };

  const openOffer = (pitch: CompanyPitch) => {
    recordView(pitch.id);
    setDetailsTarget(null);
    setOfferTarget(pitch);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-24">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">Company pitches</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Pitches published by businesses. Rate them, read the full pitch, or send an offer request.
        </p>
      </header>

      {/* Search + sector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Search company pitches</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies, sectors, or interests"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm text-[#172033] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          aria-label="Filter by sector"
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#172033] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="ALL">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Type chips + count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              aria-pressed={typeFilter === f.value}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === f.value
                  ? "border-[#0B63E5] bg-[#0B63E5] text-white"
                  : "border-[#E5E7EB] bg-white text-[#172033] hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!loading && (
          <span className="text-xs text-[#64748B]">
            {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
          </span>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
                <div className="flex gap-3">
                  <Skeleton width={44} height={44} borderRadius={10} />
                  <div className="flex-1">
                    <Skeleton width="50%" height={16} />
                    <Skeleton width="30%" height={12} />
                  </div>
                </div>
                <Skeleton count={3} height={12} />
                <Skeleton height={36} borderRadius={8} />
              </div>
            ))}
          </div>
        </SkeletonTheme>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h3 className="text-base font-bold text-gray-800">
            {pitches.length === 0 ? "No company pitches yet" : "No pitches match your filters"}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">
            {pitches.length === 0
              ? "New pitches appear here as soon as businesses publish them."
              : "Clear the search or pick a different sector or type."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((pitch) => {
            const average = Number(pitch.averageRating || 0);
            const name = pitch.company.companyName;
            return (
              <article
                key={pitch.id}
                className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 transition hover:border-[#2563EB]/40"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold ${avatarColor(name)}`}
                    >
                      {pitch.company.logoUrl ? (
                        <Image src={pitch.company.logoUrl} alt={name} fill className="object-cover" />
                      ) : (
                        getInitials(name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-[#172033]">{name}</h2>
                      {pitch.company.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#64748B]">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{pitch.company.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#E5E7EB] px-2 py-1 text-[11px] font-semibold text-[#172033]"
                    title={
                      average > 0
                        ? `Average rating ${average.toFixed(1)} from ${pitch.ratingCount || 0} investors`
                        : "No ratings yet"
                    }
                  >
                    <Star size={12} className="fill-[#2563EB] text-[#2563EB]" />
                    {average > 0 ? average.toFixed(1) : "–"}
                    <span className="font-medium text-[#64748B]">({pitch.ratingCount || 0})</span>
                  </span>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                    {PITCH_TYPE_LABEL[pitch.type]}
                  </span>
                  <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                    {pitch.stage}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {pitch.sector}
                  </span>
                </div>

                {/* Tagline */}
                <h3 className="mt-3 text-sm font-bold text-[#172033]">{pitch.tagline || pitch.title}</h3>

                {/* Deal terms */}
                <dl className="mt-4 grid grid-cols-2 gap-4 border-y border-[#E5E7EB] py-3">
                  <div className="min-w-0">
                    <dt className="text-[11px] text-[#64748B]">Target raise</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-[#172033]">
                      {pitch.targetAmount ? formatTargetAmount(pitch.targetAmount) : "Not specified"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] text-[#64748B]">Terms offered</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-[#172033]">
                      {pitch.equityOffered || "Open to discussion"}
                    </dd>
                  </div>
                </dl>

                {/* Executive summary: clamped to 3 lines, ellipsis when longer */}
                <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-xs leading-5 text-[#64748B]">
                  {pitch.summary}
                </p>

                {/* Highlights */}
                {pitch.highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-[#64748B]">
                      <Handshake size={13} /> Highlights
                    </span>
                    {pitch.highlights.slice(0, 3).map((item, i) => (
                      <span
                        key={`${item}-${i}`}
                        className="max-w-[12rem] truncate rounded-md border border-[#E5E7EB] px-2 py-0.5 font-medium text-[#172033]"
                      >
                        {item}
                      </span>
                    ))}
                    {pitch.highlights.length > 3 && (
                      <span className="text-[#64748B]">+{pitch.highlights.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
                    <Users size={13} className="shrink-0" />
                    <span className="truncate">{pitch.company.founderName || "Founder"}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openRate(pitch)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-gray-50"
                    >
                      <Star
                        size={13}
                        className={pitch.userRating ? "fill-[#2563EB] text-[#2563EB]" : "text-[#64748B]"}
                      />
                      {pitch.userRating ? `Rated ${pitch.userRating}/5` : "Rate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(pitch)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-gray-100"
                    >
                      <FileText size={13} /> View pitch details
                    </button>
                    <button
                      type="button"
                      onClick={() => openOffer(pitch)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B63E5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0A56C8]"
                    >
                      <Send size={13} /> Send offer request
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {detailsTarget && (
        <CompanyPitchDetailsModal
          pitch={detailsTarget}
          onClose={() => setDetailsTarget(null)}
          onRate={() => openRate(detailsTarget)}
          onSendOffer={() => openOffer(detailsTarget)}
        />
      )}

      {rateTarget && (
        <RatePitchModal
          pitchId={rateTarget.id}
          pitchTitle={rateTarget.title}
          currentRating={rateTarget.userRating}
          currentFeedback={rateTarget.userFeedback}
          onClose={() => setRateTarget(null)}
          onSuccess={() => fetchPitches(false)}
        />
      )}

      {offerTarget && (
        <MakeOfferModal
          pitchId={offerTarget.id}
          pitchTitle={offerTarget.title}
          companyName={offerTarget.company.companyName}
          onClose={() => setOfferTarget(null)}
          onSuccess={() => setOfferTarget(null)}
        />
      )}
    </div>
  );
}
