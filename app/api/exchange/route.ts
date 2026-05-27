import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCrossConnections } from "@/lib/exchange";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user){
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const currentCompanyQuery = await prisma.$queryRaw<any[]>`
      SELECT "type", "dealIn", "needsVector"::text as "needsVector"
      FROM "CompanyProfile" 
      WHERE "userId" = ${user.id}
      LIMIT 1
    `;

    if (!currentCompanyQuery || currentCompanyQuery.length === 0) {
      return NextResponse.json({ success: false, message: "Please complete your company profile first." }, { status: 400 });
    }

    const currentCompany = currentCompanyQuery[0];
    const crossConnections = getCrossConnections(currentCompany.type, currentCompany.dealIn);

    let searchVector: number[] = [];

    if (crossConnections.length > 0) {
      const syntheticNeedsText = `Offering services in: ${crossConnections.join(", ")}`;
      searchVector = await generateEmbedding(syntheticNeedsText);
    } else if (currentCompany.needsVector) {
      searchVector = JSON.parse(currentCompany.needsVector);
    } else {
      return NextResponse.json({ success: true, data: [], message: "No match data available" });
    }

    const formattedVector = `[${searchVector.join(",")}]`;

    const matchedCompanies = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id, 
        c."companyName", 
        c."logoUrl", 
        c."dealIn",
        c."type",
        c."description",
        c."size",
        c."yearOfEstablishment",
        (1 - (c."offeringVector" <=> ${formattedVector}::vector)) as "matchScore",
        (SELECT COUNT(*) FROM "Follow" WHERE "followingId" = u.id) as "followersCount",
        (SELECT COUNT(*) FROM "Connection" WHERE ("senderId" = u.id OR "receiverId" = u.id) AND "status" = 'ACCEPTED') as "connectionsCount",
        u.id as "authorId",
        u.name as "authorName"
      FROM "CompanyProfile" c
      JOIN "User" u ON c."userId" = u.id
      WHERE c."userId" != ${user.id}
      AND c."offeringVector" IS NOT NULL
      ORDER BY "matchScore" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const formattedData = matchedCompanies.map(company => {
      const overlaps = company.dealIn.filter((service: string) => 
        crossConnections.some(cc => cc.toLowerCase() === service.toLowerCase())
      );

      return {
        ...company,
        followersCount: Number(company.followersCount),
        connectionsCount: Number(company.connectionsCount),
        matchPercentage: Math.round(company.matchScore * 100),
        matchReason: overlaps.length > 0 
          ? `They offer ${overlaps.join(", ")} which you are looking for.` 
          : "Matched based on business industry alignment.",
        author: {
          id: company.authorId,
          name: company.authorName,
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: { page, limit }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}