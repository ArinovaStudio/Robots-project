"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Send,
  Star,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTargetAmount } from "@/lib/utils";

export interface CompanyPitchDetails {
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
    location: string | null;
    founderName: string | null;
  };
  userRating?: number | null;
  averageRating?: number;
  ratingCount?: number;
}

interface CompanyPitchDetailsModalProps {
  pitch: CompanyPitchDetails;
  onClose: () => void;
  onRate: () => void;
  onSendOffer: () => void;
}

export const PITCH_TYPE_LABEL: Record<CompanyPitchDetails["type"], string> = {
  PITCH: "Formal pitch",
  PRODUCT: "Live product",
  IDEA: "Early idea",
};

export const PITCH_TYPE_STYLE: Record<CompanyPitchDetails["type"], string> = {
  PITCH: "bg-blue-50 text-blue-700",
  PRODUCT: "bg-blue-50 text-blue-700",
  IDEA: "bg-blue-50 text-blue-700",
};

export default function CompanyPitchDetailsModal({
  pitch,
  onClose,
  onRate,
  onSendOffer,
}: CompanyPitchDetailsModalProps) {
  const postedOn = new Date(pitch.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const average = Number(pitch.averageRating || 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-0 text-left"
        showCloseButton
      >
        <DialogHeader className="gap-1 border-b border-[#E5E7EB] px-6 py-5 pr-12 text-left">
          <DialogTitle className="text-lg font-bold text-[#172033]">
            {pitch.company.companyName}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
            {pitch.company.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {pitch.company.location}
              </span>
            )}
            {pitch.company.founderName && (
              <span className="inline-flex items-center gap-1">
                <User size={12} /> {pitch.company.founderName}
              </span>
            )}
            <span>Posted {postedOn}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${PITCH_TYPE_STYLE[pitch.type]}`}
              >
                {PITCH_TYPE_LABEL[pitch.type]}
              </span>
              <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                {pitch.stage}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {pitch.sector}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#172033]">
                <Star size={13} className="fill-[#2563EB] text-[#2563EB]" />
                {average > 0 ? average.toFixed(1) : "No ratings"}
                {average > 0 && (
                  <span className="font-medium text-[#64748B]">
                    ({pitch.ratingCount || 0})
                  </span>
                )}
              </span>
            </div>
            <h3 className="mt-3 text-base font-bold text-[#172033]">{pitch.title}</h3>
            {pitch.tagline && (
              <p className="mt-0.5 text-sm font-medium text-[#2563EB]">{pitch.tagline}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
            <div>
              <span className="block text-[11px] text-[#64748B]">Target raise</span>
              <span className="mt-0.5 block text-lg font-bold text-[#172033]">
                {pitch.targetAmount ? formatTargetAmount(pitch.targetAmount) : "Not specified"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#64748B]">Terms offered</span>
              <span className="mt-0.5 block text-lg font-bold text-[#172033]">
                {pitch.equityOffered || "Open to discussion"}
              </span>
            </div>
          </div>

          <section>
            <h4 className="mb-2 text-xs font-semibold text-[#64748B]">
              Executive summary & pitch
            </h4>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#172033]">
              {pitch.summary}
            </p>
          </section>

          {pitch.highlights.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold text-[#64748B]">Key traction metrics</h4>
              <ul className="flex flex-wrap gap-2">
                {pitch.highlights.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-medium text-[#172033]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(pitch.pitchDeckUrl || pitch.websiteUrl) && (
            <section className="flex flex-col gap-2 sm:flex-row">
              {pitch.pitchDeckUrl && (
                <a
                  href={pitch.pitchDeckUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText size={15} className="text-red-500" /> Pitch deck
                  </span>
                  <ExternalLink size={13} className="text-[#64748B]" />
                </a>
              )}
              {pitch.websiteUrl && (
                <a
                  href={pitch.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Globe size={15} className="text-[#2563EB]" /> Demo / website
                  </span>
                  <ExternalLink size={13} className="text-[#64748B]" />
                </a>
              )}
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#F8FAFC] px-6 py-4">
          <Link
            href={`/profile/${pitch.userId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            View company profile <ArrowUpRight size={13} />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#172033] hover:bg-gray-50"
            >
              <Star
                size={13}
                className={
                  pitch.userRating ? "fill-[#2563EB] text-[#2563EB]" : "text-[#64748B]"
                }
              />
              {pitch.userRating ? `Your rating: ${pitch.userRating}/5` : "Rate"}
            </button>
            <button
              type="button"
              onClick={onSendOffer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B63E5] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0A56C8]"
            >
              <Send size={13} /> Send offer request
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
