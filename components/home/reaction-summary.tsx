"use client";

import { topReactionTypes, type PostReactionType, type ReactionCounts } from "@/lib/reactions";
import ReactionIcon from "./reaction-icon";

interface ReactionSummaryProps {
  counts: ReactionCounts;
  total: number;
  userReaction: PostReactionType | null;
  onOpen: () => void;
}

/** Stacked reaction icons + count under a post. Clicking it opens the list of people who reacted. */
export default function ReactionSummary({ counts, total, userReaction, onOpen }: ReactionSummaryProps) {
  if (total <= 0) return null;

  const types = topReactionTypes(counts, 3);
  const others = total - 1;
  const label = userReaction
    ? others > 0 ? `You and ${others} ${others === 1 ? "other" : "others"}` : "You"
    : String(total);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${total} ${total === 1 ? "reaction" : "reactions"}. See who reacted`}
      className="flex items-center gap-1.5 rounded-md py-0.5 text-xs text-gray-500 hover:text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500"
    >
      <span className="flex items-center" aria-hidden>
        {types.map((type, i) => (
          <span
            key={type}
            style={{ zIndex: types.length - i }}
            className={`relative flex rounded-full ring-2 ring-white ${i > 0 ? "-ml-1.5" : ""}`}
          >
            <ReactionIcon type={type} size={18} />
          </span>
        ))}
      </span>
      <span>{label}</span>
    </button>
  );
}
