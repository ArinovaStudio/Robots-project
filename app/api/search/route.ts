import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user: currentUser } = await getUser();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const AND: any[] = [{ user: { status: "ACTIVE" } }];

    if (currentUser) {
      AND.push({ userId: { not: currentUser.id } });
    }

    if (type) {
      AND.push({ type: type });
    }

    if (search) {
      const cleanSearch = search.replace(/^#/, '').trim();
      const searchWithSpaces = cleanSearch.replace(/-/g, ' ');
      const titleCaseSearch = searchWithSpaces.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      
      const arrayVariations = [ search, cleanSearch, searchWithSpaces, titleCaseSearch, searchWithSpaces.toUpperCase() ];

      AND.push({
        OR: [
          { companyName: { contains: cleanSearch, mode: "insensitive" } },
          { description: { contains: cleanSearch, mode: "insensitive" } },
          { type: { contains: cleanSearch, mode: "insensitive" } },
          { location: { contains: cleanSearch, mode: "insensitive" } },
          { dealIn: { hasSome: arrayVariations } },
          { lookingFor: { hasSome: arrayVariations } }
        ]
      });
    }

    const whereClause = { AND };

    const [companies, totalCount] = await Promise.all([
      prisma.companyProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ isBoosted: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          userId: true,
          companyName: true,
          description: true,
          logoUrl: true,
          type: true,
          size: true,
          yearOfEstablishment: true,
          user: {
            select: {
              _count: {
                select: {
                  followers: true, 
                  receivedConnections: { where: { status: "ACCEPTED" } },
                  sentConnections: { where: { status: "ACCEPTED" } }
                }
              }
            }
          }
        }
      }),
      prisma.companyProfile.count({ where: whereClause })
    ]);

    const formatted = companies.map(c => ({
      ...c,
      followersCount: c.user._count.followers,
      connectionsCount: c.user._count.receivedConnections + c.user._count.sentConnections
    }));

    // saving analytics
    const logPromises = [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (search.trim()) {
      const isTag = search.trim().startsWith("#");
      const queryTerm = search.trim().toLowerCase();

      logPromises.push(
        prisma.searchStat.upsert({
          where: { query_date_isTag: { query: queryTerm, date: today, isTag } },
          update: { count: { increment: 1 } },
          create: { query: queryTerm, date: today, isTag }
        })
      );
    }

    if (companies.length > 0) {
      for (const c of companies) {
        logPromises.push(
          prisma.searchImpressionStat.upsert({
            where: { companyId_date: { companyId: c.id, date: today } },
            update: { count: { increment: 1 } },
            create: { companyId: c.id, date: today }
          })
        );
      }
    }

    Promise.all(logPromises);

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}