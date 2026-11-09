
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

export async function getSuppliers(userId: string): Promise<CompanyProfileWithVectors[]> {
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
    LIMIT 40
  `;
}

export async function getBuyers(userId: string): Promise<CompanyProfileWithVectors[]> {
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
    LIMIT 40
  `;
}

export async function getPostMatchesSuppliers(userId: string): Promise<CompanyProfileWithVectors[]> {
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
      LIMIT 40
    `;
  } catch (err) {
    console.error("getPostMatchesSuppliers error:", err);
    return [];
  }
}

export async function getPostMatchesBuyers(userId: string): Promise<CompanyProfileWithVectors[]> {
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
      LIMIT 40
    `;
  } catch (err) {
    console.error("getPostMatchesBuyers error:", err);
    return [];
  }
}

export async function getMatches(
  userId: string,
  matchType: "similar" | "suggested" | "suppliers" | "buyers",
  source: "overall" | "posts" | "profile" = "overall"
) {
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!userProfile) return [];

    let candidates: CompanyProfileWithVectors[] = [];

    if (matchType === "similar") {
      candidates = await getSimilarCompanies(userId);
    } else if (matchType === "suggested") {
      candidates = await getSuggestedCompanies(userId);
    } else if (matchType === "suppliers") {
      if (source === "profile") {
        const profileItems = await getSuppliers(userId);
        candidates = profileItems.map((c) => ({
          ...c,
          matchSource: "profile",
          matchReason: "Profile match",
        }));
      } else if (source === "posts") {
        const postItems = await getPostMatchesSuppliers(userId);
        candidates = postItems.map((c) => ({
          ...c,
          matchSource: "post",
          matchReason: "Post match",
        }));
      } else {
        // Overall: combine both and deduplicate
        const [profileItems, postItems] = await Promise.all([
          getSuppliers(userId),
          getPostMatchesSuppliers(userId),
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
        const profileItems = await getBuyers(userId);
        candidates = profileItems.map((c) => ({
          ...c,
          matchSource: "profile",
          matchReason: "Profile match",
        }));
      } else if (source === "posts") {
        const postItems = await getPostMatchesBuyers(userId);
        candidates = postItems.map((c) => ({
          ...c,
          matchSource: "post",
          matchReason: "Post match",
        }));
      } else {
        // Overall: combine both and deduplicate
        const [profileItems, postItems] = await Promise.all([
          getBuyers(userId),
          getPostMatchesBuyers(userId),
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

    if (candidates.length === 0) return [];

    const boostedCompanies = candidates.filter((c) => c.isBoosted);
    const freeCompanies = candidates.filter((c) => !c.isBoosted);

    const shuffledBoosted = boostedCompanies.sort(() => 0.5 - Math.random());
    const shuffledFree = freeCompanies.sort(() => 0.5 - Math.random());

    const finalFeed = [...shuffledBoosted, ...shuffledFree].slice(0, 15);

    const cleanMatches = finalFeed.map((company) => {
      const { offeringVector, needsVector, ...safeData } = company;
      return safeData;
    });

    const userIds = cleanMatches.map((c) => c.userId);
    const isMarketplace = matchType === "suppliers" || matchType === "buyers";

    const [userCounts, connectedIds, collabRows, scores] = await Promise.all([
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
      isMarketplace ? getConnectedAmong(userId, userIds) : Promise.resolve(new Set<string>()),
      isMarketplace
        ? prisma.$queryRaw<{ requesterId: string; recipientId: string; status: string }[]>`
            SELECT "requesterId", "recipientId", "status"
            FROM "MarketplaceCollaboration"
            WHERE ("requesterId" = ${userId} AND "recipientId" = ANY(${userIds}::text[]))
               OR ("recipientId" = ${userId} AND "requesterId" = ANY(${userIds}::text[]))
          `.catch(() => [])
        : Promise.resolve([]),
      isMarketplace
        ? scoreMatches(userProfile, finalFeed, matchType as "suppliers" | "buyers")
        : Promise.resolve(new Map()),
    ]);

    const countsMap = new Map(userCounts.map((u) => [u.id, u._count]));

    // Relationship with each company: pending proposal (either direction) or already collaborated
    const pendingIds = new Set<string>(); // requests I sent (can be cancelled)
    const incomingIds = new Set<string>(); // requests they sent me
    const collaboratedIds = new Set<string>();
    collabRows.forEach((r) => {
      const other = r.requesterId === userId ? r.recipientId : r.requesterId;
      if (r.status === "PENDING") (r.requesterId === userId ? pendingIds : incomingIds).add(other);
      else if (r.status === "ACCEPTED" || r.status === "COMPLETED") collaboratedIds.add(other);
    });

    const results = cleanMatches
      .filter((company) => !collaboratedIds.has(company.userId)) // already collaborated: don't show again
      .map((company) => {
        const counts = countsMap.get(company.userId);
        const score = scores.get(company.userId);
        return {
          ...company,
          followersCount: counts?.followers || 0,
          connectionsCount: (counts?.receivedConnections || 0) + (counts?.sentConnections || 0),
          ...(isMarketplace && {
            collabStatus: pendingIds.has(company.userId) ? "PENDING" : incomingIds.has(company.userId) ? "INCOMING" : "NONE",
            isConnected: connectedIds.has(company.userId),
            matchScore: score?.score ?? null,
            matchScoreSource: score?.source ?? null, // "ollama" | "keyword"
            matchedServices: score?.matchedServices ?? [],
            matchedKeywords: score?.matchedKeywords ?? [],
            matchedTags: score?.matchedTags ?? [],
          }),
        };
      });
      if (isMarketplace) {
  results.sort(
    (a, b) =>
      ((b as { matchScore?: number | null }).matchScore ?? -1) -
      ((a as { matchScore?: number | null }).matchScore ?? -1)
  );
}
return results;
  } catch (err) {
    console.error("getMatches error:", err);
    return [];
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