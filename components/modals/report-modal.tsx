"use client";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ReportModal({ postId, onClose }: { postId: string, onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return alert("Please select a reason.");
    setLoading(true);
    try {
      const res = await fetch("/api/user/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reason, details })
      });
      const data = await res.json();
      if (data.success) {
        alert("Report submitted successfully.");
        onClose();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 mb-4 text-red-500">
          <AlertTriangle size={20} />
          <h3 className="text-lg font-bold text-slate-900">Report Post</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Reason</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="SPAM">Spam</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="HATE_SPEECH">Hate Speech</option>
              <option value="NUDITY_OR_SEXUAL_CONTENT">Inappropriate Content</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Details (Optional)</label>
            <textarea 
              value={details} 
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Help us understand the issue..."
              className="mt-1 w-full h-24 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none"
            />
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !reason}
            className="w-full bg-red-600 text-white h-10 rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}