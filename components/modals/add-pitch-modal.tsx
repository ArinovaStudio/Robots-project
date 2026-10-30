"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, IndianRupee, Layers, Building2, Link as LinkIcon, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatTargetAmount } from "@/lib/utils";


interface AddPitchModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPitchModal({ onClose, onSuccess }: AddPitchModalProps) {
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [type, setType] = useState<"PITCH" | "PRODUCT" | "IDEA">("PITCH");
  const [summary, setSummary] = useState("");
  const [sector, setSector] = useState("AI & Machine Learning");
  const [stage, setStage] = useState("Seed");
  const [targetAmount, setTargetAmount] = useState("");
  const [equityOffered, setEquityOffered] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const addHighlight = () => {
    if (highlightInput.trim() && highlights.length < 5) {
      setHighlights([...highlights, highlightInput.trim()]);
      setHighlightInput("");
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handlePitchDeckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF files must be 10 MB or smaller.");
      return;
    }

    setPitchDeckFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !sector.trim()) {
      toast.error("Please fill in title, summary, and sector.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("tagline", tagline.trim());
      formData.append("type", type);
      formData.append("summary", summary.trim());
      formData.append("sector", sector);
      formData.append("stage", stage);
      formData.append("targetAmount", targetAmount.trim() ? formatTargetAmount(targetAmount.trim()) : "");
      formData.append("equityOffered", equityOffered.trim());
      formData.append("highlights", JSON.stringify(highlights));
      formData.append("pitchDeckUrl", pitchDeckUrl.trim());
      formData.append("websiteUrl", websiteUrl.trim());
      if (pitchDeckFile) formData.append("pitchDeck", pitchDeckFile);

      const res = await fetch("/api/company/pitches", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Pitch submitted successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to save pitch");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Add New Pitch / Opportunity</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Publish an idea, live product, or formal investment pitch to verified investors.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Pitch Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Opportunity Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "PITCH", label: "Formal Pitch", desc: "Seeking equity / SAFE investment" },
                { id: "PRODUCT", label: "Live Product", desc: "Market-ready with traction" },
                { id: "IDEA", label: "Early Idea", desc: "Early-stage concept seeking angels" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setType(opt.id as "PITCH" | "PRODUCT" | "IDEA")}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    type === opt.id
                      ? "border-blue-600 bg-blue-50/70 text-blue-900"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-bold text-xs">{opt.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Project / Pitch Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Autonomous SLAM Fleet for Warehouses"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">One-line Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Next-gen collaborative AMR robots reducing order fulfillment by 60%"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Sector / Industry *</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Robotics & Automation">Robotics & Automation</option>
                <option value="Fintech">Fintech</option>
                <option value="SaaS & Enterprise Software">SaaS & Enterprise Software</option>
                <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                <option value="Clean Energy & Climate">Clean Energy & Climate</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="E-Commerce & Supply Chain">E-Commerce & Supply Chain</option>
                <option value="Hardware & IoT">Hardware & IoT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Funding Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Pre-seed">Pre-seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B+">Series B+</option>
                <option value="Bridge / Growth">Bridge / Growth</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Target Raise Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  onBlur={() => setTargetAmount((prev) => formatTargetAmount(prev))}
                  placeholder="e.g. ₹500k, 100k, or 1M"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Equity / Terms Offered</label>
              <input
                type="text"
                value={equityOffered}
                onChange={(e) => setEquityOffered(e.target.value)}
                placeholder="e.g. 8% SAFE or 10% Equity"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Executive Summary & Pitch *</label>
            <textarea
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Explain the problem you solve, your proprietary edge, current traction, and why this is a high-return opportunity..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Key Highlights */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Key Traction Metrics (Up to 4)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
                placeholder="e.g. $50k MRR, 12 signed LOIs, Patented Tech"
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addHighlight}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                Add
              </button>
            </div>
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {highlights.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {h}
                    <button type="button" onClick={() => removeHighlight(i)} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Pitch Deck Link (URL)</label>
              <input
                type="url"
                value={pitchDeckUrl}
                onChange={(e) => setPitchDeckUrl(e.target.value)}
                placeholder="https://docsend.com/view/..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="mt-3 block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Or upload PDF (up to 10 MB)
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePitchDeckChange}
                disabled={loading}
                className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
              {pitchDeckFile && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-xs text-gray-700">
                    <FileText size={14} className="shrink-0 text-blue-600" />
                    <span className="truncate">{pitchDeckFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPitchDeckFile(null)}
                    disabled={loading}
                    className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Demo / Website Link</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Publish Pitch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
