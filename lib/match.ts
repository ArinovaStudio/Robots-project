// import { prisma } from "./prisma";
// import { CompanyProfile } from "@prisma/client";

// interface CompanyProfileWithVectors extends CompanyProfile {
//   offeringVector?: number[];
//   needsVector?: number[];
//   similarity?: number;
// }

// export async function getSimilarCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
//   const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });  
//   if (!userProfile) return [];

//   return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
//     SELECT cp.*, 
//      (1 - (cp."offeringVector" <=> (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId}))) as similarity
//      FROM "CompanyProfile" cp
//      INNER JOIN "User" u ON cp."userId" = u.id
//      WHERE cp."userId" != ${userId} 
//      AND u.status = 'ACTIVE'
//      AND (cp."dealIn" && ${userProfile.dealIn}::text[] OR cp."type" = ${userProfile.type})
//      AND NOT EXISTS (
//        SELECT 1 FROM "Connection" c
//        WHERE (c."senderId" = ${userId} AND c."receiverId" = cp."userId")
//           OR (c."senderId" = cp."userId" AND c."receiverId" = ${userId})
//      )
//      ORDER BY cp."isBoosted" DESC, similarity DESC
//      LIMIT 40
//   `;
// }

// export async function getSuggestedCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
//   const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
//   if (!userProfile) return [];

//   return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
//     SELECT cp.*, 
//     (1 - (cp."offeringVector" <=> COALESCE(
//       (SELECT "needsVector" FROM "CompanyProfile" WHERE "userId" = ${userId}),
//       (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId})
//     ))) as similarity
//     FROM "CompanyProfile" cp
//     INNER JOIN "User" u ON cp."userId" = u.id
//     WHERE cp."userId" != ${userId}
//     AND u.status = 'ACTIVE'
//     AND NOT EXISTS (
//       SELECT 1 FROM "Connection" c
//       WHERE (c."senderId" = ${userId} AND c."receiverId" = cp."userId")
//          OR (c."senderId" = cp."userId" AND c."receiverId" = ${userId})
//     )
//     ORDER BY cp."isBoosted" DESC, similarity DESC
//     LIMIT 40
//   `;
// }

// export async function getMatches(userId: string, matchType: "similar" | "suggested") {
//   try {
//     const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
//     if (!userProfile) return [];

//     const candidates = matchType === "similar" ? await getSimilarCompanies(userId) : await getSuggestedCompanies(userId);
//     if (candidates.length === 0) return [];

//     const boostedCompanies = candidates.filter(c => c.isBoosted);
//     const freeCompanies = candidates.filter(c => !c.isBoosted);

//     const shuffledBoosted = boostedCompanies.sort(() => 0.5 - Math.random());
//     const shuffledFree = freeCompanies.sort(() => 0.5 - Math.random());

//     const finalFeed = [...shuffledBoosted, ...shuffledFree].slice(0, 10);

//     const cleanMatches = finalFeed.map((company) => {
//       const { offeringVector, needsVector, ...safeData } = company;
//       return safeData;
//     });

//     return cleanMatches;

//   } catch {
//     return [];
//   }
// }


// export async function getSuggestedFeedAuthors(userId: string): Promise<string[]> {
//   try {
//     const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    
//     if (!userProfile) {
//       const activeAuthors = await prisma.post.findMany({
//         where: { status: 'ACTIVE', author: { status: 'ACTIVE' } },
//         select: { authorId: true },
//         distinct: ['authorId'],
//         take: 20,
//       });
//       return activeAuthors.map(a => a.authorId);
//     }

//     const candidates = await prisma.$queryRaw<{userId: string}[]>`
//       SELECT cp."userId"
//       FROM "CompanyProfile" cp
//       INNER JOIN "User" u ON cp."userId" = u.id
//       WHERE cp."userId" != ${userId} 
//       AND u.status = 'ACTIVE'
//       AND EXISTS (SELECT 1 FROM "Post" p WHERE p."authorId" = cp."userId" AND p.status = 'ACTIVE')
//       ORDER BY cp."isBoosted" DESC, 
//       (1 - (cp."offeringVector" <=> COALESCE(
//         (SELECT "needsVector" FROM "CompanyProfile" WHERE "userId" = ${userId}),
//         (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId})
//       ))) DESC
//       LIMIT 40
//     `;

//     return candidates.map(c => c.userId);
//   } catch {
//     return [];
//   }
// }








// lib/match.ts
import { prisma } from "./prisma";
import { CompanyProfile } from "@prisma/client";
import { getCrossConnections } from "./exchange";

interface CompanyProfileWithVectors extends CompanyProfile {
  offeringVector?: number[];
  needsVector?: number[];
  similarity?: number;
}

export async function getSimilarCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
  const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });  
  if (!userProfile) return [];

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

export async function getMatches(userId: string, matchType: "similar" | "suggested") {
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!userProfile) return [];

    const candidates = matchType === "similar" ? await getSimilarCompanies(userId) : await getSuggestedCompanies(userId);
    if (candidates.length === 0) return [];

    const boostedCompanies = candidates.filter(c => c.isBoosted);
    const freeCompanies = candidates.filter(c => !c.isBoosted);

    const shuffledBoosted = boostedCompanies.sort(() => 0.5 - Math.random());
    const shuffledFree = freeCompanies.sort(() => 0.5 - Math.random());

    const finalFeed = [...shuffledBoosted, ...shuffledFree].slice(0, 10);

    // collect userIds to fetch counts & author info in a single query
    const userIds = finalFeed.map(c => c.userId).filter(Boolean) as string[];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            followers: true,
            sentConnections: { where: { status: "ACCEPTED" } },
            receivedConnections: { where: { status: "ACCEPTED" } }
          }
        }
      }
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    // build enriched output that matches Exchange API shape
    const formatted = finalFeed.map(company => {
      const user = usersMap.get(company.userId);
      const followersCount = user ? Number(user._count.followers || 0) : 0;
      const connectionsCount = user ? Number((user._count.sentConnections || 0) + (user._count.receivedConnections || 0)) : 0;

      const matchPercentage = Math.round((company.similarity ?? 0) * 100);

      const crossConnections = getCrossConnections(company.exchangeDataset);
      let matchReason = `Based on AI analysis, their offerings in ${company.dealIn?.[0]} strongly align with your business needs.`;
      if (crossConnections.length > 0) {
        matchReason = `Our AI suggests you might need ${crossConnections[0]}, which semantically matches their offerings in ${company.dealIn?.[0]}.`;
      }

      const author = user ? { id: user.id, name: user.name } : { id: company.userId, name: null };

      // remove vector fields before returning
      const { offeringVector, needsVector, ...rest } = company;

      return {
        id: rest.id,
        companyName: rest.companyName,
        logoUrl: rest.logoUrl,
        description: rest.description,
        dealIn: rest.dealIn,
        type: rest.type,
        size: rest.size,
        yearOfEstablishment: rest.yearOfEstablishment,
        website: rest.website,
        location: rest.location,
        lookingFor: rest.lookingFor,
        isBoosted: rest.isBoosted,

        followersCount,
        connectionsCount,

        matchPercentage,

        matchReason,

        author
      };
    });

    return formatted;

  } catch {
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

    const candidates = await prisma.$queryRaw<{userId: string}[]>`
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