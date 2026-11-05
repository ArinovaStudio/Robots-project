"use client";

import { Heart, HandHeart, Laugh, Lightbulb, PartyPopper, ThumbsUp, type LucideIcon } from "lucide-react";
import { REACTION_META, type PostReactionType } from "@/lib/reactions";

const ICONS: Record<PostReactionType, LucideIcon> = {
  LIKE: ThumbsUp,
  CELEBRATE: PartyPopper,
  SUPPORT: HandHeart,
  LOVE: Heart,
  INSIGHTFUL: Lightbulb,
  FUNNY: Laugh,
};

/** LinkedIn-style reaction badge: a white icon on a filled circle in the reaction's brand colour. */
export default function ReactionIcon({ type, size = 20, className = "" }: { type: PostReactionType; size?: number; className?: string }) {
  const Icon = ICONS[type];
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: REACTION_META[type].color }}
    >
      <Icon size={Math.round(size * 0.58)} strokeWidth={2.4} fill={type === "LOVE" || type === "LIKE" ? "currentColor" : "none"} />
    </span>
  );
}
