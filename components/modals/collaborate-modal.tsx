"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Handshake,
  IndianRupee,
  Loader2,
  MessageSquareText,
  Percent,
  Send,
  Upload,
  X,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/AuthStore";

export const COLLABORATION_TYPES = [
  "Capital investment",
  "Strategic Partnership",
  "Business companion",
  "Market access and networking",
  "Revenue / profit sharing",
  "Debt / venture debt recovering",
] as const;

// Retained for backwards compatibility
export const COLLABORATION_EXPECTATIONS = [
  "Access to new customers",
  "Expand into new markets",
  "Increase revenue and sales",
  "Technology or software integration",
  "Product development",
  "Marketing and brand promotion",
  "Share industry expertise",
  "Access to infrastructure or resources",
  "Reduce operational costs",
  "Research and innovation",
  "Distribution and supply chain support",
  "Long-term strategic partnership",
  "Other",
] as const;

export const BUSINESS_OFFERINGS = [
  "Financial resources",
  "Technical expertise",
  "Software / Technology",
  "Marketing and advertising",
  "Customer base",
  "Distribution network",
  "Infrastructure",
  "Skilled workforce",
  "Industry connections",
  "Research capabilities",
  "Products or services",
  "Other",
] as const;

const MESSAGE_MAX = 1000;

const labelClass = "mb-1.5 block text-xs font-semibold text-gray-800";
const fieldWrap =
  "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30";
const fieldInput =
  "w-full bg-transparent py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60";

function Required() {
  return <span className="text-red-500"> *</span>;
}

interface CollaborateModalProps {
  recipientId: string;
  companyName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CollaborateModal({
  recipientId,
  companyName,
  onClose,
  onSuccess,
}: CollaborateModalProps) {
  const me = useUserStore((s) => s.user);
  const requesterName = me?.investor?.firmName || me?.company?.companyName || me?.name || "You";

  const [collaborationType, setCollaborationType] = useState("");
  const [targetOpportunity, setTargetOpportunity] = useState("");
  const [proposedInvestment, setProposedInvestment] = useState("");
  const [yourParticipation, setYourParticipation] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (selected.size > 25 * 1024 * 1024) {
      toast.error("File size must be 25 MB or smaller.");
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (
      !collaborationType ||
      !targetOpportunity.trim() ||
      !proposedInvestment.trim() ||
      !yourParticipation.trim() ||
      !message.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("recipientId", recipientId);
      formData.append("collaborationType", collaborationType);
      formData.append("targetOpportunity", targetOpportunity.trim());
      formData.append("proposedInvestment", proposedInvestment.trim());
      formData.append("yourParticipation", yourParticipation.trim());
      formData.append("message", message.trim());
      if (file) {
        formData.append("document", file);
      }

      const res = await fetch("/api/marketplace/collaborate", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        toast.error(json?.message || "Failed to send collaboration request.");
        return;
      }

      toast.success(`Collaboration request sent to ${companyName}.`);
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
      aria-labelledby="collab-modal-title"
    >
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-blue-600" />
              <h3 id="collab-modal-title" className="text-lg font-bold text-gray-900">
                Collaboration request with {companyName}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Invite <span className="font-semibold text-gray-700">{companyName}</span> to collaborate on an opportunity.
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
            {/* 1. Requesting investor and collaborating business prefetched */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Requesting Investor<Required /> <span className="font-normal text-gray-500">(You)</span>
                </label>
                <div className={`${fieldWrap} bg-gray-50`}>
                  <Building2 size={16} className="shrink-0 text-gray-500" />
                  <input value={requesterName} readOnly tabIndex={-1} className={`${fieldInput} cursor-not-allowed`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Collaborating Business<Required />
                </label>
                <div className={`${fieldWrap} bg-gray-50`}>
                  <Building2 size={16} className="shrink-0 text-gray-500" />
                  <input value={companyName} readOnly tabIndex={-1} className={`${fieldInput} cursor-not-allowed`} />
                </div>
              </div>
            </div>

            {/* 2. Collaboration Type in full row */}
            <div>
              <label htmlFor="collab-type" className={labelClass}>
                Collaboration Type<Required />
              </label>
              <div className={fieldWrap}>
                <Handshake size={16} className="shrink-0 text-gray-500" />
                <select
                  id="collab-type"
                  value={collaborationType}
                  onChange={(e) => setCollaborationType(e.target.value)}
                  disabled={loading}
                  required
                  className={`${fieldInput} ${collaborationType ? "" : "text-gray-400"}`}
                >
                  <option value="" disabled>Select collaboration type</option>
                  {COLLABORATION_TYPES.map((t) => (
                    <option key={t} value={t} className="text-gray-900">{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Target Opportunity field */}
            <div>
              <label htmlFor="target-opportunity" className={labelClass}>
                Target Opportunity<Required />
              </label>
              <div className={fieldWrap}>
                <Building2 size={16} className="shrink-0 text-gray-500" />
                <input
                  id="target-opportunity"
                  value={targetOpportunity}
                  onChange={(e) => setTargetOpportunity(e.target.value)}
                  maxLength={120}
                  disabled={loading}
                  required
                  placeholder="e.g. Scaling market distribution, expansion, co-development"
                  className={fieldInput}
                />
              </div>
            </div>

            {/* 4. Proposed investment and Your participation */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="proposed-investment" className={labelClass}>
                  Proposed Investment<Required />
                </label>
                <div className={fieldWrap}>
                  <IndianRupee size={16} className="shrink-0 text-gray-500" />
                  <input
                    id="proposed-investment"
                    value={proposedInvestment}
                    onChange={(e) => setProposedInvestment(e.target.value)}
                    maxLength={60}
                    disabled={loading}
                    required
                    placeholder="e.g. ₹50 Lakhs / $500K"
                    className={fieldInput}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="your-participation" className={labelClass}>
                  Your Participation<Required />
                </label>
                <div className={fieldWrap}>
                  <Percent size={16} className="shrink-0 text-gray-500" />
                  <input
                    id="your-participation"
                    value={yourParticipation}
                    onChange={(e) => setYourParticipation(e.target.value)}
                    maxLength={60}
                    disabled={loading}
                    required
                    placeholder="e.g. Equity, advisory, strategic resources"
                    className={fieldInput}
                  />
                </div>
              </div>
            </div>

            {/* 5. Collaboration Message */}
            <div>
              <label htmlFor="collab-message" className={labelClass}>
                Collaboration Message<Required />
              </label>
              <div className={`${fieldWrap} items-start pt-2.5`}>
                <MessageSquareText size={16} className="mt-0.5 shrink-0 text-gray-500" />
                <div className="w-full">
                  <textarea
                    id="collab-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MESSAGE_MAX}
                    rows={4}
                    disabled={loading}
                    required
                    placeholder="Share details about the collaboration, terms, and how you would like to work together."
                    className={`${fieldInput} resize-none py-0`}
                  />
                  <p className="pb-2 text-right text-xs text-gray-400">
                    {message.length} / {MESSAGE_MAX.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Attach document with single browse */}
            <div>
              <p className={labelClass}>
                Attach Document <span className="font-normal text-gray-500">(Optional)</span>
              </p>
              <p className="mb-2 text-xs text-gray-500">Share any supporting pitch deck, proposal, or document.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                    <FileText size={18} className="shrink-0 text-blue-600" />
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={loading}
                    aria-label="Remove document"
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 transition disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
                >
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-xs font-semibold text-gray-800">Browse Document</span>
                  <span className="text-[11px] text-gray-500">(PDF, Word, PPT, Excel up to 25MB)</span>
                </button>
              )}
            </div>
          </div>

          {/* 7. Collaboration request in place of send partnership request */}
          <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? "Sending…" : "Collaboration request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
