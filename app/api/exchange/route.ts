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
      console.log(syntheticNeedsText);
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
        c."isBoosted",
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
      ORDER BY c."isBoosted" DESC, "matchScore" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    let formattedData = matchedCompanies.map(company => {
      const overlaps = company.dealIn.filter((service: string) => 
        crossConnections.some(cc => 
          cc.toLowerCase().includes(service.toLowerCase()) || 
          service.toLowerCase().includes(cc.toLowerCase())
        )
      );

      let matchReason = "";
      if (overlaps.length > 0) {
        matchReason = `They offer ${overlaps.join(", ")} which directly aligns with your required services.`;
      } else if (crossConnections.length > 0) {
        matchReason = `Because you offer ${currentCompany.dealIn[0] || 'your services'}, you might need ${crossConnections[0]}, which semantically matches their offerings in ${company.dealIn[0]}.`;
      } else {
        matchReason = `Matched based on robust business alignment with the ${company.type} sector.`;
      }

      return {
        ...company,
        followersCount: Number(company.followersCount || 0),
        connectionsCount: Number(company.connectionsCount || 0),
        matchPercentage: Math.round(company.matchScore * 100),
        isBoosted: company.isBoosted,
        matchReason: matchReason,
        author: {
          id: company.authorId,
          name: company.authorName,
        }
      };
    });

    formattedData = formattedData.sort(() => Math.random() - 0.5);
    formattedData = formattedData.sort((a, b) => (b.isBoosted === true ? 1 : 0) - (a.isBoosted === true ? 1 : 0));

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: { page, limit }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}