import { prisma } from "./prisma";
import { CompanyProfile } from "@prisma/client";

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

    const cleanMatches = finalFeed.map((company) => {
      const { offeringVector, needsVector, ...safeData } = company;
      return safeData;
    });

    return cleanMatches;

  } catch {
    return [];
  }
}