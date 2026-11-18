"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Handshake,
  IndianRupee,
  Info,
  Layers,
  Loader2,
  MessageSquareText,
  Percent,
  Send,
  Upload,
  X,
  FileText,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/AuthStore";
import { COLLABORATION_DOCUMENTS, COLLABORATION_TYPES, DEAL_STAGES } from "@/lib/investor-options";

const MESSAGE_MAX = 1000;

const labelClass = "mb-1.5 block text-xs font-semibold text-gray-800";
const fieldWrap =
  "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30";
const fieldInput =
  "w-full bg-transparent py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60";

type DocKey = (typeof COLLABORATION_DOCUMENTS)[number]["key"];

function Required() {
  return <span className="text-red-500"> *</span>;
}

export default function InvestorCollaborationModal({
  collaboratorId,
  collaboratorName,
  onClose,
  onSuccess,
}: {
  collaboratorId: string;
  collaboratorName: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const me = useUserStore((s) => s.user);
  const requesterName = me?.investor?.firmName || me?.name || "You";

  const [collaborationType, setCollaborationType] = useState("");
  const [dealStage, setDealStage] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");
  const [participation, setParticipation] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<Partial<Record<DocKey, File>>>({});
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const inputRefs = useRef<Partial<Record<DocKey, HTMLInputElement | null>>>({});

  const handleFile = (doc: (typeof COLLABORATION_DOCUMENTS)[number], e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!(doc.exts as readonly string[]).some((ext) => lower.endsWith(ext))) {
      toast.error(`${doc.label} must be a ${doc.exts.map((x) => x.slice(1).toUpperCase()).join(" or ")} file.`);
      return;
    }
    if (file.size > doc.maxMb * 1024 * 1024) {
      toast.error(`${doc.label} must be ${doc.maxMb} MB or smaller.`);
      return;
    }
    setFiles((prev) => ({ ...prev, [doc.key]: file }));
  };

  const removeFile = (key: DocKey) =>
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;

    if (
      !collaborationType ||
      !dealStage ||
      !targetCompany.trim() ||
      !proposedAmount.trim() ||
      !participation.trim() ||
      !message.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("collaboratorId", collaboratorId);
      formData.append("collaborationType", collaborationType);
      formData.append("dealStage", dealStage);
      formData.append("targetCompany", targetCompany.trim());
      formData.append("proposedAmount", proposedAmount.trim());
      formData.append("participation", participation.trim());
      formData.append("message", message.trim());
      for (const doc of COLLABORATION_DOCUMENTS) {
        const file = files[doc.key];
        if (file) formData.append(doc.key, file);
      }

      const res = await fetch("/api/investor/collaborations", { method: "POST", body: formData });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.message || "Failed to send collaboration request.");
        return;
      }

      toast.success(`Collaboration request sent to ${collaboratorName}.`);
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="i2i-collab-title"
    >
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-blue-600" />
              <h3 id="i2i-collab-title" className="text-lg font-bold text-gray-900">
                Partnership request with {collaboratorName}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Invite <span className="font-semibold text-gray-700">{collaboratorName}</span> to collaborate on an investment opportunity.
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
                  Collaborating Investor<Required />
                </label>
                <div className={`${fieldWrap} bg-gray-50`}>
                  <Building2 size={16} className="shrink-0 text-gray-500" />
                  <input value={collaboratorName} readOnly tabIndex={-1} className={`${fieldInput} cursor-not-allowed`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ic-type" className={labelClass}>
                  Collaboration Type<Required />
                </label>
                <div className={fieldWrap}>
                  <Handshake size={16} className="shrink-0 text-gray-500" />
                  <select
                    id="ic-type"
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
              <div>
                <label htmlFor="ic-stage" className={labelClass}>
                  Deal Stage<Required />
                </label>
                <div className={fieldWrap}>
                  <Layers size={16} className="shrink-0 text-gray-500" />
                  <select
                    id="ic-stage"
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    disabled={loading}
                    required
                    className={`${fieldInput} ${dealStage ? "" : "text-gray-400"}`}
                  >
                    <option value="" disabled>Select deal stage</option>
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s} className="text-gray-900">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ic-target" className={labelClass}>
                Target Company / Investment Opportunity<Required />
              </label>
              <div className={fieldWrap}>
                <Building2 size={16} className="shrink-0 text-gray-500" />
                <input
                  id="ic-target"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  maxLength={120}
                  disabled={loading}
                  required
                  placeholder="Name of the startup or company we are looking to invest in"
                  className={fieldInput}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ic-amount" className={labelClass}>
                  Proposed Investment Amount<Required />
                </label>
                <div className={fieldWrap}>
                  <IndianRupee size={16} className="shrink-0 text-gray-500" />
                  <input
                    id="ic-amount"
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(e.target.value)}
                    maxLength={60}
                    disabled={loading}
                    required
                    placeholder="e.g. ₹1 Cr / $1M"
                    className={fieldInput}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="ic-participation" className={labelClass}>
                  Your Participation<Required />
                </label>
                <div className={fieldWrap}>
                  <Percent size={16} className="shrink-0 text-gray-500" />
                  <input
                    id="ic-participation"
                    value={participation}
                    onChange={(e) => setParticipation(e.target.value)}
                    maxLength={60}
                    disabled={loading}
                    required
                    placeholder="e.g. ₹50 Lakhs (50%)"
                    className={fieldInput}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ic-message" className={labelClass}>
                Collaboration Message<Required />
              </label>
              <div className={`${fieldWrap} items-start pt-2.5`}>
                <MessageSquareText size={16} className="mt-0.5 shrink-0 text-gray-500" />
                <div className="w-full">
                  <textarea
                    id="ic-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MESSAGE_MAX}
                    rows={4}
                    disabled={loading}
                    required
                    placeholder="Share the investment thesis, why this opportunity is attractive, and how you would like to collaborate."
                    className={`${fieldInput} resize-none py-0`}
                  />
                  <p className="pb-2 text-right text-xs text-gray-400">
                    {message.length} / {MESSAGE_MAX.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className={labelClass}>
                Attach Documents <span className="font-normal text-gray-500">(Optional)</span>
              </p>
              <p className="mb-2 text-xs text-gray-500">Share any supporting documents for the investor&apos;s review.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {COLLABORATION_DOCUMENTS.map((doc) => {
                  const file = files[doc.key];
                  return (
                    <div key={doc.key}>
                      <input
                        ref={(el) => {
                          inputRefs.current[doc.key] = el;
                        }}
                        type="file"
                        accept={doc.exts.join(",")}
                        onChange={(e) => handleFile(doc, e)}
                        disabled={loading}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => inputRefs.current[doc.key]?.click()}
                        disabled={loading}
                        className={`flex h-full w-full flex-col items-center gap-1 rounded-xl border border-dashed px-2 py-3 text-center transition ${
                          file ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/40"
                        }`}
                      >
                        {file ? <Check size={20} className="text-green-600" /> : <Upload size={20} className="text-gray-500" />}
                        <span className="text-xs font-semibold text-gray-800">{doc.label}</span>
                        <span className="text-[11px] text-gray-500">{doc.hint}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {COLLABORATION_DOCUMENTS.some((d) => files[d.key]) && (
                <ul className="mt-3 space-y-2">
                  {COLLABORATION_DOCUMENTS.filter((d) => files[d.key]).map((doc) => {
                    const file = files[doc.key]!;
                    return (
                      <li key={doc.key} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                          <FileText size={16} className="shrink-0 text-red-500" />
                          <span className="truncate">{file.name}</span>
                          <span className="shrink-0 text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key)}
                          disabled={loading}
                          aria-label={`Remove ${doc.label}`}
                          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            </div>
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
              {loading ? "Sending…" : "Send partnership request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
