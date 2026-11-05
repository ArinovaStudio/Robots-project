export const POST_REACTION_TYPES = ["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL", "FUNNY"] as const;

export type PostReactionType = (typeof POST_REACTION_TYPES)[number];
export type ReactionCounts = Partial<Record<PostReactionType, number>>;

export const REACTION_META: Record<PostReactionType, { label: string; color: string; textClass: string }> = {
  LIKE: { label: "Like", color: "#378FE9", textClass: "text-[#0a66c2]" },
  CELEBRATE: { label: "Celebrate", color: "#6DAE4F", textClass: "text-[#44712e]" },
  SUPPORT: { label: "Support", color: "#A872E8", textClass: "text-[#715e86]" },
  LOVE: { label: "Love", color: "#DF704D", textClass: "text-[#b24020]" },
  INSIGHTFUL: { label: "Insightful", color: "#F5BB5C", textClass: "text-[#915907]" },
  FUNNY: { label: "Funny", color: "#3FBEC7", textClass: "text-[#1a707e]" },
};

export function isPostReactionType(value: unknown): value is PostReactionType {
  return typeof value === "string" && (POST_REACTION_TYPES as readonly string[]).includes(value);
}

export function summarizeReactions(rows: { type: string; _count: { type: number } }[]) {
  const reactionCounts: ReactionCounts = {};
  let likesCount = 0;
  for (const row of rows) {
    if (!isPostReactionType(row.type)) continue;
    reactionCounts[row.type] = row._count.type;
    likesCount += row._count.type;
  }
  return { reactionCounts, likesCount };
}

/** Types with at least one reaction, most used first (ties keep LinkedIn order). */
export function topReactionTypes(counts: ReactionCounts, limit = 3): PostReactionType[] {
  return POST_REACTION_TYPES.filter((t) => (counts[t] ?? 0) > 0)
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
    .slice(0, limit);
}
