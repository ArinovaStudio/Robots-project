"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MapPin, Send } from "lucide-react";
import VerificationBadge from "@/components/ui/VerificationBadge";
import SendPitchRequestModal from "@/components/modals/send-pitch-request-modal";

export interface InvestorCardData {
  id: string;
  name: string;
  image: string | null;
  verificationStatus: string;
  firmName: string | null;
  investorType: string;
  sectors: string[];
  stages: string[];
  investmentRange: string;
  location: string | null;
  investmentThesis: string | null;
  previousInvestmentCount: number | null;
}

export default function InvestorCard({ investor }: { investor: InvestorCardData }) {
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const subtitle = investor.firmName
    ? `${investor.investorType} · ${investor.firmName}`
    : investor.investorType;

  return (
    <article className="flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex min-h-16 items-center gap-4">
        <Link
          href={`/profile/${investor.id}`}
          className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#EFF6FF]"
        >
          {investor.image ? (
            <Image src={investor.image} alt={investor.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#2563EB]">
              {investor.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${investor.id}`}
            className="flex min-w-0 items-center gap-1.5 text-lg font-bold leading-tight text-[#172033] hover:text-[#2563EB] hover:underline"
          >
            <span className="truncate">{investor.name}</span>
            <VerificationBadge status={investor.verificationStatus} size="xs" />
          </Link>
          <p className="mt-1 truncate text-sm font-medium text-[#64748B]">{subtitle}</p>
        </div>
      </div>

      <p className="mt-4 min-h-10 text-sm leading-relaxed text-[#64748B] line-clamp-2">
        {investor.investmentThesis || "Investor profile"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {investor.sectors.slice(0, 3).map((sector) => (
          <span key={sector} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {sector}
          </span>
        ))}
        {investor.sectors.length > 3 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            +{investor.sectors.length - 3}
          </span>
        )}
      </div>

      <div className="mt-auto">
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E5E7EB] pt-4 text-xs text-[#64748B]">
          <div>
            <p className="font-semibold text-[#172033]">Investment range</p>
            <p className="mt-1 truncate">{investor.investmentRange || "Not specified"}</p>
          </div>
          <div>
            <p className="font-semibold text-[#172033]">Stages</p>
            <p className="mt-1 truncate">{investor.stages.slice(0, 2).join(", ") || "Not specified"}</p>
          </div>
          {investor.location && (
            <p className="col-span-2 flex items-center gap-1 truncate">
              <MapPin size={13} className="shrink-0" />
              {investor.location}
            </p>
          )}
        </div>

        {requestSent ? (
          <button
            type="button"
            disabled
            className="mt-4 inline-flex w-full cursor-default items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700"
          >
            <CheckCircle2 size={16} />
            Pitch request sent
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPitchForm(true)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Send pitch request
            <Send size={16} />
          </button>
        )}
      </div>

      {showPitchForm && (
        <SendPitchRequestModal
          investorId={investor.id}
          investorName={investor.name}
          onClose={() => setShowPitchForm(false)}
          onSuccess={() => setRequestSent(true)}
        />
      )}
    </article>
  );
}
