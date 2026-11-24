"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatTargetAmount } from "@/lib/utils";

interface MakeOfferModalProps {
  pitchId: string;
  pitchTitle: string;
  companyName: string;
  /** Target raise published by the business; pre-fills "Proposed investment". */
  targetAmount?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const INTEREST_OPTIONS = ["Investment offer"];

const inputClass =
  "w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-200";
const labelClass = "mb-1.5 block text-sm font-bold text-[#172033]";

export default function MakeOfferModal({
  pitchId,
  companyName,
  targetAmount,
  onClose,
  onSuccess,
}: MakeOfferModalProps) {
  const [interest, setInterest] = useState(INTEREST_OPTIONS[0]);
  const [amount, setAmount] = useState(targetAmount ? formatTargetAmount(targetAmount) : "");
  const [terms, setTerms] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim()) {
      toast.error("Please enter the proposed investment.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/investor/pitches/${pitchId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.trim(),
          terms: terms.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Offer request sent!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to send offer request.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-request-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="offer-request-title" className="text-2xl font-extrabold tracking-tight text-[#172033]">
              Send an offer request
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">Share your interest with {companyName}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-[#64748B] hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label htmlFor="offer-interest" className={labelClass}>
              I’m interested in
            </label>
            <select
              id="offer-interest"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className={`${inputClass} px-4`}
            >
              {INTEREST_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="offer-amount" className={labelClass}>
                Proposed investment
              </label>
              <input
                id="offer-amount"
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => setAmount((prev) => (prev ? formatTargetAmount(prev) : ""))}
                placeholder="e.g. ₹10L"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="offer-terms" className={labelClass}>
                Suggested terms
              </label>
              <input
                id="offer-terms"
                type="text"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="e.g. Equity or SAFE"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="offer-message" className={labelClass}>
              Message to the business
            </label>
            <textarea
              id="offer-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share a little about your interest or the collaboration you have in mind."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="flex justify-end border-t border-[#E5E7EB] pt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4FD7] disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send offer request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
