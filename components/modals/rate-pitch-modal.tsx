"use client";

import { useState } from "react";
import { X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

interface RatePitchModalProps {
  pitchId: string;
  pitchTitle: string;
  currentRating?: number | null;
  currentFeedback?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RatePitchModal({
  pitchId,
  pitchTitle,
  currentRating,
  currentFeedback,
  onClose,
  onSuccess,
}: RatePitchModalProps) {
  const [rating, setRating] = useState<number>(currentRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState(currentFeedback || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/investor/pitches/${pitchId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (currentRating ? "Rating updated!" : "Rating submitted!"));
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to submit rating.");
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
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {currentRating ? "Update Rating & Feedback" : "Rate Pitch / Idea"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{pitchTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="text-center py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              How would you rate this idea (out of 5)?
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`${
                      (hoverRating || rating) >= star
                        ? "text-amber-500 fill-amber-500"
                        : "text-gray-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm font-extrabold text-amber-600">{rating} out of 5 stars</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Investor Feedback / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like? What risks or milestones should the founder focus on?"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {currentRating ? "Update Rating" : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
