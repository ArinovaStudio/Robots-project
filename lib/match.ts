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
    SELECT *, 
    (1 - ("offeringVector" <=> (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId}))) as similarity
    FROM "CompanyProfile"
    WHERE "userId" != ${userId} 
    AND ("dealIn" && ${userProfile.dealIn}::text[] OR "type" = ${userProfile.type})
    ORDER BY similarity DESC
    LIMIT 10
  `;
}

export async function getSuggestedCompanies(userId: string): Promise<CompanyProfileWithVectors[]> {
  const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
  
  if (!userProfile) return [];

  return await prisma.$queryRaw<CompanyProfileWithVectors[]>`
    SELECT *, 
    (1 - ("offeringVector" <=> COALESCE(
      (SELECT "needsVector" FROM "CompanyProfile" WHERE "userId" = ${userId}),
      (SELECT "offeringVector" FROM "CompanyProfile" WHERE "userId" = ${userId})
    ))) as similarity
    FROM "CompanyProfile"
    WHERE "userId" != ${userId}
    ORDER BY similarity DESC
    LIMIT 10
  `;
}

export async function getMatches(userId: string, matchType: "similar" | "suggested") {
  try {
    const userProfile = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!userProfile) return [];

    const candidates = matchType === "similar" ? await getSimilarCompanies(userId) : await getSuggestedCompanies(userId);
    if (candidates.length === 0) return [];

    const cleanMatches = candidates.map((company) => {
      const { offeringVector, needsVector, ...safeData } = company;
      return safeData;
    });

    return cleanMatches;

  } catch {
    return [];
  }
}