"use client";

import { useState } from "react";
import { X, Loader2, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";

interface MakeOfferModalProps {
  pitchId: string;
  pitchTitle: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MakeOfferModal({
  pitchId,
  pitchTitle,
  companyName,
  onClose,
  onSuccess,
}: MakeOfferModalProps) {
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("SAFE (Valuation cap)");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim()) {
      toast.error("Please enter the offer amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/investor/pitches/${pitchId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.trim(),
          terms: terms.trim(),
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Offer submitted to founder!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to submit offer.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Make Investment Offer</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pitch: <strong className="text-gray-800">{pitchTitle}</strong> ({companyName})
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Offer Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. $100,000 or $250k"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Investment Structure / Terms
            </label>
            <select
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="SAFE (Valuation cap)">SAFE (Valuation cap)</option>
              <option value="Priced Equity Round">Priced Equity Round</option>
              <option value="Convertible Note">Convertible Note</option>
              <option value="Strategic Pilot / Capital">Strategic Pilot / Capital</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Message / Term Sheet Note (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Outline valuation expectations, target close date, and syndicate details..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Send Investment Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
