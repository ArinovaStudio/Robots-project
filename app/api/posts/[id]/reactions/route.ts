import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleToViewer, getConnectedAmong } from "@/lib/post-visibility";
import { isPostReactionType, POST_REACTION_TYPES, summarizeReactions } from "@/lib/reactions";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Who reacted to a post. Optional `type` filter, paged with `page` / `limit`.
 * Also returns per-type counts so the client can draw the tabs from one request.
 */
export async function GET( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const sp = req.nextUrl.searchParams;

    const typeParam = sp.get("type");
    if (typeParam && !isPostReactionType(typeParam)) {
      return NextResponse.json({ success: false, message: "Invalid reaction type" }, { status: 400 });
    }

    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(sp.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

    // Only people who can see the post can see who reacted to it.
    const post = await prisma.post.findFirst({
      where: { id: postId, status: "ACTIVE", AND: [visibleToViewer(user.id)] },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    // Post reactions only (DISLIKE is a comment-only type).
    const typeFilter = typeParam ? { type: typeParam as (typeof POST_REACTION_TYPES)[number] } : { type: { in: [...POST_REACTION_TYPES] } };

    const [rows, grouped] = await Promise.all([
      prisma.postReaction.findMany({
        where: { postId, ...typeFilter },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit + 1,
        select: {
          id: true,
          type: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              verificationStatus: true,
              company: { select: { companyName: true, logoUrl: true, location: true } },
            },
          },
        },
      }),
      prisma.postReaction.groupBy({ by: ["type"], where: { postId }, _count: { type: true } }),
    ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const connected = await getConnectedAmong(user.id, pageRows.map((r) => r.user.id));
    const { reactionCounts, likesCount } = summarizeReactions(grouped);

    const data = pageRows.map((r) => ({
      id: r.id,
      type: r.type,
      createdAt: r.createdAt,
      isYou: r.user.id === user.id,
      isConnection: connected.has(r.user.id),
      user: r.user,
    }));

    return NextResponse.json({
      success: true,
      data,
      counts: reactionCounts,
      total: likesCount,
      pagination: { page, limit, hasMore },
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
