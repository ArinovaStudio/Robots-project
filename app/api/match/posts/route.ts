import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeReactions } from "@/lib/reactions";
import {
  visibleToViewer,
  withCanComment,
  withHasReposted,
  withIsFollowing,
  notHiddenBy,
  repostOfInclude,
} from "@/lib/post-visibility";

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "your", "our", "services", "service",
  "solutions", "solution", "company", "business", "other", "more", "all", "any",
]);

/** Phrase itself + its meaningful words (4+ letters), lower-cased. */
function termsFor(item: string): string[] {
  const phrase = item.trim().toLowerCase();
  if (!phrase) return [];
  const words = phrase
    .split(/[^a-z0-9+#.]+/i)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  return Array.from(new Set([phrase, ...words]));
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    if (user.accountType === "INVESTOR") {
      return NextResponse.json({ success: false, message: "Not available for investors." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const tab = searchParams.get("tab") === "buyers" ? "buyers" : "suppliers";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(30, parseInt(searchParams.get("limit") || "10", 10) || 10));

    const profile = await prisma.companyProfile.findUnique({
      where: { userId: user.id },
      select: { dealIn: true, lookingFor: true },
    });

    // suppliers: what I need  -> match their offerings. buyers: what I offer -> match their needs.
    const sourceItems = ((tab === "suppliers" ? profile?.lookingFor : profile?.dealIn) || [])
      .map((s) => s.trim())
      .filter(Boolean);

    if (sourceItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        hasProfileTerms: false,
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    const termsByItem = new Map<string, string[]>(sourceItems.map((item) => [item, termsFor(item)]));
    const allTerms = Array.from(new Set(Array.from(termsByItem.values()).flat())).slice(0, 30);
    const wantedIntent = tab === "suppliers" ? "OFFERING" : "LOOKING_FOR";
    const oppositeIntent = tab === "suppliers" ? "LOOKING_FOR" : "OFFERING";

    const baseWhere = {
      status: "ACTIVE" as const,
      repostOfId: null,
      authorId: { not: user.id },
      author: { accountType: "BUSINESS" as const, status: "ACTIVE" as const },
      OR: [
        ...allTerms.map((t) => ({ content: { contains: t, mode: "insensitive" as const } })),
        {
          businessIntent: {
            is: { isBusinessIntent: true, intentType: wantedIntent, services: { hasSome: allTerms } },
          },
        },
      ],
      // a post the AI tagged as the opposite direction is not a fit
      NOT: { businessIntent: { is: { isBusinessIntent: true, intentType: oppositeIntent } } },
    };

    const candidates = await prisma.post.findMany({
      where: { AND: [baseWhere, visibleToViewer(user.id), notHiddenBy(user.id)] },
      orderBy: { updatedAt: "desc" },
      take: 150,
      include: {
        media: true,
        event: true,
        repostOf: repostOfInclude,
        businessIntent: { select: { intentType: true, services: true, isBusinessIntent: true } },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            verificationStatus: true,
            company: {
              select: { companyName: true, logoUrl: true, isBoosted: true, website: true, location: true, lookingFor: true },
            },
          },
        },
        _count: { select: { comments: true } },
        reactions: { where: { userId: user.id }, select: { type: true } },
        savedBy: { where: { userId: user.id }, select: { id: true } },
      },
    });

    // Score: which of the viewer's own services / needs each post touches
    const scored = candidates
      .map((post) => {
        const text = `${post.content || ""} ${(post.businessIntent?.services || []).join(" ")}`.toLowerCase();
        const matched: string[] = [];
        let score = 0;
        for (const [item, terms] of termsByItem) {
          const phraseHit = text.includes(terms[0]);
          const wordHits = terms.slice(1).filter((t) => text.includes(t)).length;
          if (phraseHit || wordHits > 0) {
            matched.push(item);
            score += (phraseHit ? 3 : 0) + wordHits;
          }
        }
        if (post.businessIntent?.isBusinessIntent && post.businessIntent.intentType === wantedIntent) score += 2;
        if (post.author.company?.isBoosted) score += 1;
        return { post, matched, score };
      })
      .filter((s) => s.matched.length > 0)
      .sort((a, b) => b.score - a.score || +new Date(b.post.updatedAt) - +new Date(a.post.updatedAt));

    const total = scored.length;
    const slice = scored.slice((page - 1) * limit, page * limit);
    const matchedByPost = new Map(slice.map((s) => [s.post.id, s.matched]));

    const rawPosts = slice.map((s) => s.post);
    const posts = await withIsFollowing(
      await withHasReposted(await withCanComment(rawPosts, user.id), user.id),
      user.id
    );

    const postIds = posts.map((p) => p.id);
    const reactionRows = postIds.length
      ? await prisma.postReaction.groupBy({
          by: ["postId", "type"],
          where: { postId: { in: postIds } },
          _count: { type: true },
        })
      : [];

    const data = posts.map((post) => {
      const { likesCount, reactionCounts } = summarizeReactions(reactionRows.filter((r) => r.postId === post.id));
      if (post.author?.company) {
        post.author.company.logoUrl = post.author.company.logoUrl || post.author.image;
      }
      return {
        ...post,
        userReaction: post.reactions[0]?.type || null,
        isSaved: post.savedBy?.length > 0,
        likesCount,
        reactionCounts,
        matchedTerms: matchedByPost.get(post.id) || [],
        matchIntent: post.businessIntent?.isBusinessIntent ? post.businessIntent.intentType : null,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      hasProfileTerms: true,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Post matches error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}