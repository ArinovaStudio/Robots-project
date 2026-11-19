
import { prisma } from "./prisma";
import { CompanyProfile } from "@prisma/client";
import { scoreMatches } from "./match-score";
import { getConnectedAmong } from "./post-visibility";

interface CompanyProfileWithVectors extends CompanyProfile {
  offeringVector?: number[];
  needsVector?: number[];
  similarity?: number;
  matchSource?: "profile" | "post" | "both";
  matchReason?: string;
}

async function getFallbackCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
  return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
    SELECT cp.*
    FROM "CompanyProfile" cp
    INNER JOIN "User" u ON cp."userId" = u.id
    WHERE cp."userId" != ${userId}
      AND u.status = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1 FROM "Connection" c
        WHERE (c."senderId" = ${userId} AND c."receiverId" = cp."userId")
           OR (c."senderId" = cp."userId" AND c."receiverId" = ${userId})
      )
    ORDER BY cp."isBoosted" DESC, cp."companyName" ASC
    LIMIT 40
  `;
}

export async function getSimilarCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
  const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!userProfile) return getFallbackCompanies(userId);

  const [vectorStatus] = await prisma.$queryRaw<{ hasOfferingVector: boolean }[]>`
    SELECT "offeringVector" IS NOT NULL AS "hasOfferingVector"
    FROM "CompanyProfile"
    WHERE "userId" = ${userId}
  `;
  if (!vectorStatus?.hasOfferingVector) return getFallbackCompanies(userId);

  return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
    SELECT cp.*, 
     (1 - (cp."offeringVector" <=> (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId}))) as similarity
     FROM "CompanyProfile" cp
     INNER JOIN "User" u ON cp."userId" = u.id
     WHERE cp."userId" != ${userId} 
     AND u.status = 'ACTIVE'
     AND (cp."dealIn" && ${userProfile.dealIn}::text[] OR cp."type" = ${userProfile.type})
     AND NOT EXISTS (
       SELECT 1 FROM "Connection" c
       WHERE (c."senderId" = ${userId} AND c."receiverId" = cp."userId")
          OR (c."senderId" = cp."userId" AND c."receiverId" = ${userId})
     )
     ORDER BY cp."isBoosted" DESC, similarity DESC
     LIMIT 40
  `;
}

export async function getSuggestedCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
  const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!userProfile) return [];

  return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
    SELECT cp.*, 
    (1 - (cp."offeringVector" <=> COALESCE(
      (SELECT "needsVector" FROM "CompanyProfile" WHERE "userId" = ${userId}),
      (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId})
    ))) as similarity
    FROM "CompanyProfile" cp
    INNER JOIN "User" u ON cp."userId" = u.id
    WHERE cp."userId" != ${userId}
    AND u.status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1 FROM "Connection" c
      WHERE (c."senderId" = ${userId} AND c."receiverId" = cp."userId")
         OR (c."senderId" = cp."userId" AND c."receiverId" = ${userId})
    )
    ORDER BY cp."isBoosted" DESC, similarity DESC
    LIMIT 40
  `;
}

export async function getSuppliers(userId: string, limit = 40): Promise<CompanyProfileWithVectors[]> {
  const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!userProfile) return [];

  return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
    SELECT cp.*, 
    (1 - (cp."offeringVector" <=> (SELECT "needsVector" FROM "CompanyProfile" WHERE "userId" = ${userId}))) as similarity
    FROM "CompanyProfile" cp
    INNER JOIN "User" u ON cp."userId" = u.id
    WHERE cp."userId" != ${userId}
    AND u.status = 'ACTIVE'
    ORDER BY cp."isBoosted" DESC, similarity DESC
    LIMIT ${limit}
  `;
}

export async function getBuyers(userId: string, limit = 40): Promise<CompanyProfileWithVectors[]> {
  const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!userProfile) return [];

  return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
    SELECT cp.*, 
    (1 - (cp."needsVector" <=> (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId}))) as similarity
    FROM "CompanyProfile" cp
    INNER JOIN "User" u ON cp."userId" = u.id
    WHERE cp."userId" != ${userId}
    AND u.status = 'ACTIVE'
    ORDER BY cp."isBoosted" DESC, similarity DESC
    LIMIT ${limit}
  `;
}

export async function getPostMatchesSuppliers(userId: string, limit = 40): Promise<CompanyProfileWithVectors[]> {
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!userProfile) return [];

    return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
      SELECT cp.*,
        COALESCE(
          (
            SELECT (1 - (pbi."embedding" <=> user_cp."needsVector"))
            FROM "PostBusinessIntent" pbi
            WHERE pbi."authorId" = cp."userId"
              AND pbi."isBusinessIntent" = true
              AND pbi."intentType" = 'OFFERING'
              AND pbi."embedding" IS NOT NULL
            ORDER BY (pbi."embedding" <=> user_cp."needsVector") ASC
            LIMIT 1
          ),
          (
            SELECT (1 - (user_pbi."embedding" <=> cp."offeringVector"))
            FROM "PostBusinessIntent" user_pbi
            WHERE user_pbi."authorId" = ${userId}
              AND user_pbi."isBusinessIntent" = true
              AND user_pbi."intentType" = 'LOOKING_FOR'
              AND user_pbi."embedding" IS NOT NULL
            ORDER BY (user_pbi."embedding" <=> cp."offeringVector") ASC
            LIMIT 1
          ),
          0.8
        ) as similarity
      FROM "CompanyProfile" cp
      INNER JOIN "User" u ON cp."userId" = u.id
      CROSS JOIN "CompanyProfile" user_cp
      WHERE user_cp."userId" = ${userId}
        AND cp."userId" != ${userId}
        AND u.status = 'ACTIVE'
        AND (
          EXISTS (
            SELECT 1 FROM "PostBusinessIntent" pbi
            WHERE pbi."authorId" = cp."userId"
              AND pbi."isBusinessIntent" = true
              AND pbi."intentType" = 'OFFERING'
              AND pbi."embedding" IS NOT NULL
          )
          OR EXISTS (
            SELECT 1 FROM "PostBusinessIntent" user_pbi
            WHERE user_pbi."authorId" = ${userId}
              AND user_pbi."isBusinessIntent" = true
              AND user_pbi."intentType" = 'LOOKING_FOR'
              AND user_pbi."embedding" IS NOT NULL
          )
        )
      ORDER BY cp."isBoosted" DESC, similarity DESC
      LIMIT ${limit}
    `;
  } catch (err) {
    console.error("getPostMatchesSuppliers error:", err);
    return [];
  }
}

export async function getPostMatchesBuyers(userId: string, limit = 40): Promise<CompanyProfileWithVectors[]> {
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!userProfile) return [];

    return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
      SELECT cp.*,
        COALESCE(
          (
            SELECT (1 - (pbi."embedding" <=> user_cp."offeringVector"))
            FROM "PostBusinessIntent" pbi
            WHERE pbi."authorId" = cp."userId"
              AND pbi."isBusinessIntent" = true
              AND pbi."intentType" = 'LOOKING_FOR'
              AND pbi."embedding" IS NOT NULL
            ORDER BY (pbi."embedding" <=> user_cp."offeringVector") ASC
            LIMIT 1
          ),
          (
            SELECT (1 - (user_pbi."embedding" <=> cp."needsVector"))
            FROM "PostBusinessIntent" user_pbi
            WHERE user_pbi."authorId" = ${userId}
              AND user_pbi."isBusinessIntent" = true
              AND user_pbi."intentType" = 'OFFERING'
              AND user_pbi."embedding" IS NOT NULL
            ORDER BY (user_pbi."embedding" <=> cp."needsVector") ASC
            LIMIT 1
          ),
          0.8
        ) as similarity
      FROM "CompanyProfile" cp
      INNER JOIN "User" u ON cp."userId" = u.id
      CROSS JOIN "CompanyProfile" user_cp
      WHERE user_cp."userId" = ${userId}
        AND cp."userId" != ${userId}
        AND u.status = 'ACTIVE'
        AND (
          EXISTS (
            SELECT 1 FROM "PostBusinessIntent" pbi
            WHERE pbi."authorId" = cp."userId"
              AND pbi."isBusinessIntent" = true
              AND pbi."intentType" = 'LOOKING_FOR'
              AND pbi."embedding" IS NOT NULL
          )
          OR EXISTS (
            SELECT 1 FROM "PostBusinessIntent" user_pbi
            WHERE user_pbi."authorId" = ${userId}
              AND user_pbi."isBusinessIntent" = true
              AND user_pbi."intentType" = 'OFFERING'
              AND user_pbi."embedding" IS NOT NULL
          )
        )
      ORDER BY cp."isBoosted" DESC, similarity DESC
      LIMIT ${limit}
    `;
  } catch (err) {
    console.error("getPostMatchesBuyers error:", err);
    return [];
  }
}

/** How many ranked candidates the marketplace keeps in reach (pages are cut from this pool). */
export const MARKETPLACE_POOL = 100;
export const MARKETPLACE_PAGE_SIZE = 12;
/** false = strictly best match first. true = boosted companies stay pinned above everyone. */
const BOOSTED_FIRST = false;

/**
 * The fully scored + sorted pool for one viewer/tab/source. Page 1 builds it, later pages
 * reuse it, so scrolling never re-orders or re-scores anything and pages never overlap.
 */
const RANK_TTL_MS = 5 * 60 * 1000;
const RANK_CACHE_MAX = 200;
const rankCache = new Map<string, { expires: number; items: any[] }>();

function rememberRanking(key: string, items: any[]) {
  if (rankCache.size >= RANK_CACHE_MAX) {
    const oldest = rankCache.keys().next().value;
    if (oldest) rankCache.delete(oldest);
  }
  rankCache.set(key, { expires: Date.now() + RANK_TTL_MS, items });
}

export interface MatchOptions {
  page?: number;
  limit?: number;
  /** userIds to drop BEFORE paging (hidden companies), so pages never come back short. */
  excludeUserIds?: Set<string>;
}

export async function getMatches(
  userId: string,
  matchType: "similar" | "suggested" | "suppliers" | "buyers",
  source: "overall" | "posts" | "profile" = "overall",
  opts: MatchOptions = {}
): Promise<{ results: any[]; total: number; hasMore: boolean }> {
  const empty = { results: [], total: 0, hasMore: false };
  const isMarketplace = matchType === "suppliers" || matchType === "buyers";
  const poolSize = isMarketplace ? MARKETPLACE_POOL : 40;
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, Math.min(30, opts.limit ?? MARKETPLACE_PAGE_SIZE));
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!userProfile) return empty;

    let candidates: CompanyProfileWithVectors[] = [];

    if (matchType === "similar") {
      candidates = await getSimilarCompanies(userId);
    } else if (matchType === "suggested") {
      candidates = await getSuggestedCompanies(userId);
    } else if (matchType === "suppliers") {
      if (source === "profile") {
        const profileItems = await getSuppliers(userId, poolSize);
        candidates = profileItems.map((c) => ({
          ...c,
          matchSource: "profile",
          matchReason: "Profile match",
        }));
      } else if (source === "posts") {
        const postItems = await getPostMatchesSuppliers(userId, poolSize);
        candidates = postItems.map((c) => ({
          ...c,
          matchSource: "post",
          matchReason: "Post match",
        }));
      } else {
        // Overall: combine both and deduplicate
        const [profileItems, postItems] = await Promise.all([
          getSuppliers(userId, poolSize),
          getPostMatchesSuppliers(userId, poolSize),
        ]);

        const mergedMap = new Map<string, CompanyProfileWithVectors>();

        profileItems.forEach((c) => {
          mergedMap.set(c.id, {
            ...c,
            matchSource: "profile",
            matchReason: "Profile match",
          });
        });

        postItems.forEach((c) => {
          if (mergedMap.has(c.id)) {
            const existing = mergedMap.get(c.id)!;
            mergedMap.set(c.id, {
              ...existing,
              matchSource: "both",
              matchReason: "Both",
              similarity: Math.max(existing.similarity || 0, c.similarity || 0),
            });
          } else {
            mergedMap.set(c.id, {
              ...c,
              matchSource: "post",
              matchReason: "Post match",
            });
          }
        });

        candidates = Array.from(mergedMap.values()).sort((a, b) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          return (b.similarity || 0) - (a.similarity || 0);
        });
      }
    } else if (matchType === "buyers") {
      if (source === "profile") {
        const profileItems = await getBuyers(userId, poolSize);
        candidates = profileItems.map((c) => ({
          ...c,
          matchSource: "profile",
          matchReason: "Profile match",
        }));
      } else if (source === "posts") {
        const postItems = await getPostMatchesBuyers(userId, poolSize);
        candidates = postItems.map((c) => ({
          ...c,
          matchSource: "post",
          matchReason: "Post match",
        }));
      } else {
        // Overall: combine both and deduplicate
        const [profileItems, postItems] = await Promise.all([
          getBuyers(userId, poolSize),
          getPostMatchesBuyers(userId, poolSize),
        ]);

        const mergedMap = new Map<string, CompanyProfileWithVectors>();

        profileItems.forEach((c) => {
          mergedMap.set(c.id, {
            ...c,
            matchSource: "profile",
            matchReason: "Profile match",
          });
        });

        postItems.forEach((c) => {
          if (mergedMap.has(c.id)) {
            const existing = mergedMap.get(c.id)!;
            mergedMap.set(c.id, {
              ...existing,
              matchSource: "both",
              matchReason: "Both",
              similarity: Math.max(existing.similarity || 0, c.similarity || 0),
            });
          } else {
            mergedMap.set(c.id, {
              ...c,
              matchSource: "post",
              matchReason: "Post match",
            });
          }
        });

        candidates = Array.from(mergedMap.values()).sort((a, b) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          return (b.similarity || 0) - (a.similarity || 0);
        });
      }
    }

    // ── Non-marketplace (similar / suggested): unchanged behaviour, one shuffled batch of 15 ──
    if (!isMarketplace) {
      if (opts.excludeUserIds?.size) {
        candidates = candidates.filter((c) => !opts.excludeUserIds!.has(c.userId));
      }
      if (candidates.length === 0) return empty;
      const boosted = candidates.filter((c) => c.isBoosted).sort(() => 0.5 - Math.random());
      const free = candidates.filter((c) => !c.isBoosted).sort(() => 0.5 - Math.random());
      const batch = [...boosted, ...free].slice(0, 15).map(({ offeringVector, needsVector, ...safe }) => safe);
      const ids = batch.map((c) => c.userId);
      const counts = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          _count: {
            select: {
              followers: true,
              receivedConnections: { where: { status: "ACCEPTED" } },
              sentConnections: { where: { status: "ACCEPTED" } },
            },
          },
        },
      });
      const countsMap = new Map(counts.map((u) => [u.id, u._count]));
      const results = batch.map((company) => {
        const c = countsMap.get(company.userId);
        return {
          ...company,
          followersCount: c?.followers || 0,
          connectionsCount: (c?.receivedConnections || 0) + (c?.sentConnections || 0),
        };
      });
      return { results, total: results.length, hasMore: false };
    }

    // ── Marketplace: globally sorted by match score + real pagination ──
    const direction = matchType as "suppliers" | "buyers";
    const rankKey = `${userId}|${matchType}|${source}`;
    const cached = rankCache.get(rankKey);

    let ranked: any[];
    if (page > 1 && cached && cached.expires > Date.now()) {
      // Pages 2+ reuse the ranking page 1 just built: same order, nothing re-scored.
      ranked = cached.items;
    } else {
      if (candidates.length === 0) return empty;

      // Score the WHOLE pool (not just one page), then sort by score. Ollama results are cached
      // per company pair, and scoreMatches() never throws: anything Ollama can't finish in time
      // gets the instant keyword score instead.
      const pool = candidates.map(({ offeringVector, needsVector, ...safe }) => safe);
      const scores = await scoreMatches(userProfile, pool as any, direction);

      ranked = pool
        .map((company) => {
          const score = scores.get(company.userId);
          return {
            ...company,
            matchScore: score?.score ?? 0,
            matchScoreSource: score?.source ?? null, // "ollama" | "keyword"
            matchedServices: score?.matchedServices ?? [],
            matchedKeywords: score?.matchedKeywords ?? [],
            matchedTags: score?.matchedTags ?? [],
          };
        })
        .sort((a, b) => {
          if (BOOSTED_FIRST && a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
          if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore; // most match first
          if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1; // tie-break: boosted
          const sim = (b.similarity || 0) - (a.similarity || 0); // then vector similarity
          return sim !== 0 ? sim : a.userId.localeCompare(b.userId); // then stable
        });
      rememberRanking(rankKey, ranked);
    }

    // Per-request, cheap, and must always be fresh: hidden companies and collaboration state.
    const poolIds = ranked.map((c) => c.userId);
    const collabRows = poolIds.length
      ? await prisma.$queryRaw<{ requesterId: string; recipientId: string; status: string }[]>`
          SELECT "requesterId", "recipientId", "status"
          FROM "MarketplaceCollaboration"
          WHERE ("requesterId" = ${userId} AND "recipientId" = ANY(${poolIds}::text[]))
             OR ("recipientId" = ${userId} AND "requesterId" = ANY(${poolIds}::text[]))
        `.catch(() => [])
      : [];

    const pendingIds = new Set<string>(); // requests I sent (can be cancelled)
    const incomingIds = new Set<string>(); // requests they sent me
    const collaboratedIds = new Set<string>();
    collabRows.forEach((r) => {
      const other = r.requesterId === userId ? r.recipientId : r.requesterId;
      if (r.status === "PENDING") (r.requesterId === userId ? pendingIds : incomingIds).add(other);
      else if (r.status === "ACCEPTED" || r.status === "COMPLETED") collaboratedIds.add(other);
    });

    const visible = ranked.filter(
      (c) => !collaboratedIds.has(c.userId) && !opts.excludeUserIds?.has(c.userId)
    );
    const total = visible.length;
    const offset = (page - 1) * pageSize;
    const pageItems = visible.slice(offset, offset + pageSize);
    if (pageItems.length === 0) return { results: [], total, hasMore: false };

    // Counts and connection state are only needed for the cards actually shown.
    const userIds = pageItems.map((c) => c.userId);
    const [userCounts, connectedIds] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          _count: {
            select: {
              followers: true,
              receivedConnections: { where: { status: "ACCEPTED" } },
              sentConnections: { where: { status: "ACCEPTED" } },
            },
          },
        },
      }),
      getConnectedAmong(userId, userIds),
    ]);
    const countsMap = new Map(userCounts.map((u) => [u.id, u._count]));

    const results = pageItems.map((company) => {
      const counts = countsMap.get(company.userId);
      return {
        ...company,
        followersCount: counts?.followers || 0,
        connectionsCount: (counts?.receivedConnections || 0) + (counts?.sentConnections || 0),
        collabStatus: pendingIds.has(company.userId) ? "PENDING" : incomingIds.has(company.userId) ? "INCOMING" : "NONE",
        isConnected: connectedIds.has(company.userId),
      };
    });

    // `results` keeps the global score order. It is deliberately NOT re-sorted here.
    return { results, total, hasMore: offset + pageItems.length < total };
  } catch (err) {
    console.error("getMatches error:", err);
    return empty;
  }
}


export async function getSuggestedFeedAuthors(userId: string): Promise<string[]> {
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });

    if (!userProfile) {
      const activeAuthors = await prisma.post.findMany({
        where: { status: 'ACTIVE', author: { status: 'ACTIVE' } },
        select: { authorId: true },
        distinct: ['authorId'],
        take: 20,
      });
      return activeAuthors.map(a => a.authorId);
    }

    const candidates = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT cp."userId"
      FROM "CompanyProfile" cp
      INNER JOIN "User" u ON cp."userId" = u.id
      WHERE cp."userId" != ${userId} 
      AND u.status = 'ACTIVE'
      AND EXISTS (SELECT 1 FROM "Post" p WHERE p."authorId" = cp."userId" AND p.status = 'ACTIVE')
      ORDER BY cp."isBoosted" DESC, 
      (1 - (cp."offeringVector" <=> COALESCE(
        (SELECT "needsVector" FROM "CompanyProfile" WHERE "userId" = ${userId}),
        (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId})
      ))) DESC
      LIMIT 40
    `;

    return candidates.map(c => c.userId);
  } catch {
    return [];
  }
}