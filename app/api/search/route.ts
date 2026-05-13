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
      AND.push({
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { dealIn: { hasSome: [search] } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    const whereClause = { AND };

    const [companies, totalCount] = await Promise.all([
      prisma.companyProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ isBoosted: 'desc' }, { updatedAt: 'desc' }],
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