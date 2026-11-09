"use client";

import { useState } from "react";
import { FileText, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/AuthStore";

const MAX_PDF_BYTES = 120 * 1024 * 1024; // keep in sync with app/api/pitch-requests/route.ts

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-60";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700";

export default function SendPitchRequestModal({
  investorId,
  investorName,
  onClose,
  onSuccess,
}: {
  investorId: string;
  investorName: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const companyFromProfile = useUserStore((s) => s.user?.company?.companyName as string | undefined);

  const [companyName, setCompanyName] = useState(companyFromProfile ?? "");
  const [problemStatement, setProblemStatement] = useState("");
  const [proposedSolution, setProposedSolution] = useState("");
  const [fundingRequirement, setFundingRequirement] = useState("");
  const [equityOffered, setEquityOffered] = useState("");
  const [message, setMessage] = useState("");
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("PDF files must be 120 MB or smaller.");
      return;
    }
    setPitchDeck(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !companyName.trim() ||
      !problemStatement.trim() ||
      !proposedSolution.trim() ||
      !fundingRequirement.trim() ||
      !message.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!pitchDeck) {
      toast.error("Please attach your pitch deck (PDF).");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("investorId", investorId);
      formData.append("companyName", companyName.trim());
      formData.append("problemStatement", problemStatement.trim());
      formData.append("proposedSolution", proposedSolution.trim());
      formData.append("fundingRequirement", fundingRequirement.trim());
      formData.append("equityOffered", equityOffered.trim());
      formData.append("message", message.trim());
      formData.append("pitchDeck", pitchDeck);

      const res = await fetch("/api/pitch-requests", { method: "POST", body: formData });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        toast.error(json?.message || "Failed to send pitch request.");
        return;
      }

      toast.success(`Pitch request sent to ${investorName}.`);
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pitch-request-title"
    >
      <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <h3 id="pitch-request-title" className="text-lg font-bold text-gray-900">
                Send pitch request
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Share your pitch with <span className="font-semibold text-gray-700">{investorName}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <label htmlFor="pr-company" className={labelClass}>Startup / Company name *</label>
            <input
              id="pr-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={120}
              disabled={loading}
              placeholder="e.g. Acme Labs"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pr-problem" className={labelClass}>Problem statement *</label>
            <textarea
              id="pr-problem"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              maxLength={2000}
              rows={3}
              disabled={loading}
              placeholder="What problem are you solving, and for whom?"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="pr-solution" className={labelClass}>Proposed solution *</label>
            <textarea
              id="pr-solution"
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              maxLength={2000}
              rows={3}
              disabled={loading}
              placeholder="How does your product or service solve it?"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pr-funding" className={labelClass}>Funding requirement *</label>
              <input
                id="pr-funding"
                type="text"
                value={fundingRequirement}
                onChange={(e) => setFundingRequirement(e.target.value)}
                maxLength={60}
                disabled={loading}
                placeholder="e.g. 50L, 2Cr or $500k"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="pr-equity" className={labelClass}>
                Equity offered <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <input
                id="pr-equity"
                type="text"
                value={equityOffered}
                onChange={(e) => setEquityOffered(e.target.value)}
                maxLength={30}
                disabled={loading}
                placeholder="e.g. 10%"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pr-message" className={labelClass}>Message to investor *</label>
            <textarea
              id="pr-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={3}
              disabled={loading}
              placeholder="Introduce yourself and why this investor is a good fit."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="pr-deck" className={labelClass}>Attach pitch deck (PDF) *</label>
            {pitchDeck ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                  <FileText size={16} className="shrink-0 text-blue-600" />
                  <span className="truncate">{pitchDeck.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {(pitchDeck.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setPitchDeck(null)}
                  disabled={loading}
                  className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <input
                id="pr-deck"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleDeckChange}
                disabled={loading}
                className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            )}
            <p className="mt-1 text-xs text-gray-400">PDF only, up to 120 MB.</p>
          </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? "Sending…" : "Send pitch request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
