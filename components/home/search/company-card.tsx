"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Handshake, EyeOff, Share2, Flag, Clock, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import CompanyStats from "@/components/home/search/company-stats";
import ReportCompanyModal from "@/components/modals/report-company-modal";
import ConfirmModal from "@/components/modals/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CompanyCardProps {
  company: any;
  onCollaborate?: (company: any) => void;
  showCollaborate?: boolean;
  onHidden?: (company: any) => void;
  onCollabCancelled?: (company: any) => void;
}

/**
 * Description clamped to 1 line with a "Read more" toggle.
 * The toggle only appears when the text runs past one line.
 * The wrapper reserves the height of 1 line + the toggle row,
 * so short and long descriptions occupy the same space.
 */
function ClampedDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !expanded) setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="min-h-[3rem]">
      <p
        ref={ref}
        className={`text-sm leading-relaxed text-[#64748B] ${expanded ? "" : "line-clamp-1"}`}
      >
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-xs font-semibold text-[#2563EB] hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function CompanyCard({
  company,
  onCollaborate,
  showCollaborate = false,
  onHidden,
  onCollabCancelled,
}: CompanyCardProps) {
  const matchSource = company.matchSource;
  const matchScore: number | null = typeof company.matchScore === "number" ? company.matchScore : null;
  const isPending = company.collabStatus === "PENDING"; // I sent it: can be cancelled
  const isIncoming = company.collabStatus === "INCOMING"; // they sent it to me
  const isConnected = !!company.isConnected;

  const scoreTone =
    matchScore === null
      ? ""
      : matchScore >= 70
      ? "bg-green-100 text-green-700 border-green-300"
      : matchScore >= 40
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : "bg-red-100 text-red-700 border-red-300";
  const fallbackReason =
    company.matchReason ||
    (matchSource === "both"
      ? "Matched through profile & relevant posts"
      : matchSource === "post"
      ? "Matched through commercial post intent"
      : "Matched through business profile");

  const [hidden, setHidden] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelRequest = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/marketplace/collaborate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: company.userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Collaboration request cancelled");
        setShowCancelConfirm(false);
        onCollabCancelled?.(company);
      } else {
        toast.error(data.message || "Couldn't cancel the request");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleUndoHide = async () => {
    try {
      await fetch(`/api/company/${company.userId}/hide`, { method: "DELETE" });
      setHidden(false);
    } catch {
      toast.error("Couldn't restore this business");
    }
  };

  const handleHide = async () => {
    try {
      const res = await fetch(`/api/company/${company.userId}/hide`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setHidden(true);
        onHidden?.(company);
        toast.success(`${company.companyName} hidden`, {
          action: { label: "Undo", onClick: handleUndoHide },
        });
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/profile/${company.userId}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: company.companyName, text: `Check out ${company.companyName} on Connecto`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      toast.success("Business profile link copied");
    } catch (err: any) {
      // User dismissing the native share sheet is not an error
      if (err?.name === "AbortError") return;
      toast.error("Couldn't share the profile link");
    }
  };

  if (hidden) return null;

  return (
    // h-full + flex-col: card fills the grid row so neighbours match in height.
    // (mb-4 removed: the parent grid gap already spaces the cards.)
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex h-full flex-col">
      {/* HEADER: fixed height so logo/name/type sit at the same level in every card */}
      <div className="flex h-16 items-start justify-between gap-4">
        <div className="flex gap-4 items-center flex-1 min-w-0">
          <Link
            href={`/profile/${company.userId}`}
            className="h-16 w-16 relative rounded-xl overflow-hidden bg-gray-100 border border-[#E5E7EB] shrink-0 block"
          >
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-gray-400">
                {company.companyName.charAt(0)}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            {/* flex-nowrap + truncate: a long name can never wrap and push content down */}
            <div className="flex flex-nowrap items-center gap-2 mb-1 min-w-0">
              <Link
                href={`/profile/${company.userId}`}
                className="min-w-0 truncate text-xl sm:text-2xl font-bold leading-none text-[#172033] hover:text-[#2563EB] hover:underline transition"
              >
                {company.companyName}
              </Link>
              {company.isBoosted && (
                <span className="shrink-0 px-2 py-0.5 bg-[#EFF6FF] text-[10px] uppercase font-bold text-[#2563EB] rounded-md border border-blue-200">
                  Boosted
                </span>
              )}

              {/* Legacy source badges (only when no match score was calculated) */}
              {matchScore === null && matchSource === "both" && (
                <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-[#2563EB] rounded-md border border-blue-200">
                  Profile & Post Match
                </span>
              )}
              {matchScore === null && matchSource === "post" && (
                <span className="shrink-0 px-2 py-0.5 bg-blue-50/70 text-[10px] font-bold text-blue-700 rounded-md border border-blue-200">
                  Post Match
                </span>
              )}
            </div>
            <p className="text-sm text-[#64748B] font-medium truncate">{company.type}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More options"
              className="shrink-0 rounded-full p-1 text-[#64748B] hover:bg-gray-100 transition outline-none"
            >
              <EllipsisVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuItem onSelect={handleHide} className="gap-2 cursor-pointer">
              <EyeOff size={16} /> Hide business
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleShare} className="gap-2 cursor-pointer">
              <Share2 size={16} /> Share business profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setShowReport(true)}
              className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
            >
              <Flag size={16} /> Report business
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MIDDLE: description clamped to 2 lines with Read more, height reserved */}
      <div className="mt-4">
        <ClampedDescription text={company.description || ""} />
      </div>

      {/* STATS + FOOTER: pinned to the bottom so they line up across cards */}
      <div className="mt-auto">
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          <CompanyStats
            size={company.size}
            type={company.type}
            followers={company.followersCount}
            connections={company.connectionsCount}
            year={company.yearOfEstablishment}
          />
        </div>

        {/* Collaborate Action inside Marketplace */}
        {showCollaborate && onCollaborate && (
          <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
            {matchScore !== null ? (
              <span className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-md border ${scoreTone}`}>
                Match score: {matchScore}%
              </span>
            ) : (
              <div className="text-xs text-[#64748B] font-medium truncate">{fallbackReason}</div>
            )}

            {isPending ? (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                title="Click to cancel this request"
                className="group inline-flex items-center gap-1.5 rounded-xl bg-white border border-amber-500 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition shrink-0"
              >
                <Clock size={14} className="group-hover:hidden" />
                <X size={14} className="hidden group-hover:block" />
                <span className="group-hover:hidden">Pending</span>
                <span className="hidden group-hover:inline">Cancel request</span>
              </button>
            ) : isIncoming ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 shrink-0">
                <Clock size={14} />
                <span>Request received</span>
              </span>
            ) : isConnected ? (
              <Link
                href={`/messages/${company.userId}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shrink-0"
              >
                <MessageCircle size={14} />
                <span>Message</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onCollaborate(company)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shrink-0"
              >
                <Handshake size={14} />
                <span>Collaborate</span>
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel collaboration request?"
        message={`Your pending request to ${company.companyName} will be withdrawn. You can send a new one later.`}
        confirmText="Cancel request"
        cancelText="Keep it"
        variant="danger"
        isLoading={cancelling}
        onConfirm={handleCancelRequest}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {showReport && (
        <ReportCompanyModal
          companyUserId={company.userId}
          companyName={company.companyName}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}