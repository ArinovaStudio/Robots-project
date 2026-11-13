"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Building2,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { formatTargetAmount } from "@/lib/utils";

export interface PitchRequestData {
  id: string;
  senderId: string;
  companyName: string;
  problemStatement: string;
  proposedSolution: string;
  fundingRequirement: string;
  equityOffered: string | null;
  message: string;
  pitchDeckUrl: string;
  status: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string | null;
    image: string | null;
    company?: { companyName: string | null; logoUrl: string | null } | null;
  } | null;
}

interface ViewPitchModalProps {
  pitch: PitchRequestData;
  onClose: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export function formatPitchFunding(val?: string | null): string {
  if (!val) return "Not specified";
  const str = String(val).trim();
  // Safe recovery for historical data where unit was truncated to 1 or 50
  if (str === "1" || str === "₹1" || str === "₹ 1" || /^₹?\s*1\s*cr\.?$/i.test(str)) {
    return "₹1 Cr";
  }
  if (str === "50" || str === "₹50" || str === "₹ 50" || /^₹?\s*50\s*l(akh|ac)?s?\.?$/i.test(str)) {
    return "₹50 L";
  }
  return formatTargetAmount(str);
}

export function formatPitchEquity(val?: string | null): string {
  if (!val) return "Negotiable";
  const clean = val.trim().replace(/%+$/, "").trim();
  return clean ? `${clean}%` : "Negotiable";
}

export default function ViewPitchModal({
  pitch,
  onClose,
  onStatusChange,
}: ViewPitchModalProps) {
  const [status, setStatus] = useState<string>(pitch.status || "PENDING");
  const [updating, setUpdating] = useState(false);

  const formattedDate = new Date(pitch.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleUpdateStatus = async (newStatus: "ACCEPTED" | "DECLINED") => {
    setUpdating(true);
    try {
      const res = await fetch("/api/pitch-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pitch.id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
        toast.success(
          newStatus === "ACCEPTED"
            ? "Collaboration request accepted!"
            : "Collaboration request declined."
        );
      } else {
        toast.error(data.message || "Failed to update status.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const statusBadge = () => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case "DECLINED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 border border-gray-300">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-300">
            Pending
          </span>
        );
    }
  };

  const senderName = pitch.sender?.company?.companyName || pitch.sender?.name || pitch.companyName;
  const senderAvatar = pitch.sender?.company?.logoUrl || pitch.sender?.image;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {senderAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {pitch.companyName}
                </h3>
                {statusBadge()}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Pitch request &bull; {formattedDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-gray-800">
          {/* Key Deal Terms Strip */}
          <div className="grid grid-cols-2 rounded-xl bg-gray-50 border border-gray-200/80 p-4 divide-x divide-gray-200">
            <div className="pr-4">
              <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Funding Requirement
              </span>
              <span className="mt-1 block text-lg font-bold text-gray-900">
                {formatPitchFunding(pitch.fundingRequirement)}
              </span>
            </div>

            <div className="pl-4">
              <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Equity Offered
              </span>
              <span className="mt-1 block text-lg font-bold text-gray-900">
                {formatPitchEquity(pitch.equityOffered)}
              </span>
            </div>
          </div>

          {/* Personal Message */}
          {pitch.message && (
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                Message from Founder
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {pitch.message}
              </p>
            </div>
          )}

          {/* Problem Statement */}
          <div className="rounded-xl border border-gray-200/80 p-4 bg-white">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Problem Statement
            </h4>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {pitch.problemStatement}
            </p>
          </div>

          {/* Proposed Solution */}
          <div className="rounded-xl border border-gray-200/80 p-4 bg-white">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Proposed Solution
            </h4>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {pitch.proposedSolution}
            </p>
          </div>

          {/* Pitch Deck Attachment */}
          {pitch.pitchDeckUrl && (
            <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate block">
                    Pitch Deck (PDF)
                  </span>
                  <span className="text-xs text-gray-500">Official presentation deck</span>
                </div>
              </div>

              <a
                href={pitch.pitchDeckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition shrink-0 shadow-xs"
              >
                Open PDF
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/70">
          <Link
            href={`/profile/${pitch.senderId}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            View Business Profile
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {status === "PENDING" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("DECLINED")}
                className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Decline"}
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("ACCEPTED")}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Accept Collaboration"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
