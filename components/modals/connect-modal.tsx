"use client";

import { useState } from "react";
import { X, Loader2, Send } from "lucide-react";

interface ConnectModalProps {
  receiverId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ConnectModal({ receiverId, companyName, onClose, onSuccess }: ConnectModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendRequest = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/network/connect/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, message }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.message);
        onClose();
      } else {
        setError(data.message || "Failed to send connection request.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Connect with {companyName}</h3>
            <p className="text-xs text-slate-500 mt-1">Personalize your invitation with a short message.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="I'd love to connect and discuss potential collaborations..."
            className="w-full h-32 resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
            maxLength={500}
          />
          <div className="flex justify-end">
            <span className="text-[10px] font-medium text-slate-400">{message.length}/500</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5] py-3 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}