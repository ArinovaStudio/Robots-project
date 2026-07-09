import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCrossConnections } from "@/lib/exchange";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const currentCompanyQuery = await prisma.$queryRaw<any[]>`
      SELECT "type", "dealIn", "exchangeDataset", "needsVector"::text as "needsVector"
      FROM "CompanyProfile" 
      WHERE "userId" = ${user.id}
      LIMIT 1
    `;

    if (!currentCompanyQuery || currentCompanyQuery.length === 0) {
      return NextResponse.json({ success: false, message: "Profile incomplete." }, { status: 400 });
    }

    const currentCompany = currentCompanyQuery[0];
    const crossConnections = getCrossConnections(currentCompany.exchangeDataset);

    let formattedVector = currentCompany.needsVector; 
    
    if (!formattedVector && crossConnections.length > 0) {
      const syntheticNeedsText = `Looking for: ${crossConnections.join(", ")}`;
      const fallbackVector = await generateEmbedding(syntheticNeedsText);
      formattedVector = `[${fallbackVector.join(",")}]`;
    }

    if (!formattedVector) return NextResponse.json({ success: true, data: [] });

    const countQuery = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as "total"
      FROM "CompanyProfile" c
      WHERE c."userId" != ${user.id}
      AND c."offeringVector" IS NOT NULL
    `;
    const totalRecords = Number(countQuery[0]?.total || 0);
    const totalPages = Math.ceil(totalRecords / limit);

    const matchedCompanies = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id, c."companyName", c."logoUrl", c."dealIn", c."type", c."description", c."size", c."isBoosted", c."yearOfEstablishment",
        (1 - (c."offeringVector" <=> ${formattedVector}::vector)) as "matchScore",
        (SELECT COUNT(*) FROM "Follow" WHERE "followingId" = u.id) as "followersCount",
        (SELECT COUNT(*) FROM "Connection" WHERE ("senderId" = u.id OR "receiverId" = u.id) AND "status" = 'ACCEPTED') as "connectionsCount",
        u.id as "authorId", u.name as "authorName"
      FROM "CompanyProfile" c
      JOIN "User" u ON c."userId" = u.id
      WHERE c."userId" != ${user.id}
      AND c."offeringVector" IS NOT NULL
      ORDER BY c."isBoosted" DESC, "matchScore" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    let formattedData = matchedCompanies.map(company => {
      let matchReason = `Based on AI analysis, their offerings in ${company.dealIn[0]} strongly align with your business needs.`;
      
      if (crossConnections.length > 0) {
        matchReason = `Our AI suggests you might need ${crossConnections[0]}, which semantically matches their offerings in ${company.dealIn[0]}.`;
      }

      return {
        ...company,
        followersCount: Number(company.followersCount || 0),
        connectionsCount: Number(company.connectionsCount || 0),
        matchPercentage: Math.round(company.matchScore * 100),
        isBoosted: company.isBoosted,
        matchReason,
        author: { id: company.authorId, name: company.authorName }
      };
    });

    formattedData = formattedData.sort(() => Math.random() - 0.5);
    formattedData = formattedData.sort((a, b) => (b.isBoosted === true ? 1 : 0) - (a.isBoosted === true ? 1 : 0));

    return NextResponse.json({ 
      success: true, 
      data: formattedData, 
      pagination: { page, limit, totalPages } 
    });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}