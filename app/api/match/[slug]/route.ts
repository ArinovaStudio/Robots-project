import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { getMatches, MARKETPLACE_PAGE_SIZE } from "@/lib/match";
import { prisma } from "@/lib/prisma";

const VALID_SLUGS = ["similar", "suggested", "suppliers", "buyers"] as const;
type MatchSlug = (typeof VALID_SLUGS)[number];

export async function GET( req: NextRequest, { params }: { params: Promise<{ slug: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json( { success: false, message: error || "Unauthorized" }, { status: 401 } );
    }

    const { slug } = await params;
    
    if (!VALID_SLUGS.includes(slug as MatchSlug)) {
      return NextResponse.json( { success: false, message: "Invalid match type" }, { status: 400 } );
    }

    const sourceParam = req.nextUrl.searchParams.get("source");
    const source: "overall" | "posts" | "profile" =
      sourceParam === "posts" || sourceParam === "profile" ? sourceParam : "overall";

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(30, parseInt(req.nextUrl.searchParams.get("limit") || String(MARKETPLACE_PAGE_SIZE), 10) || MARKETPLACE_PAGE_SIZE));

    // Hidden companies are removed BEFORE paging so a page never comes back short.
    const hiddenRows = await prisma.hiddenCompany.findMany({
      where: { userId: user.id },
      select: { companyUserId: true },
    });
    const hiddenIds = new Set(hiddenRows.map((h) => h.companyUserId));

    // Investor branch (suggested / similar): single batch, unchanged.
    if (user.accountType === "INVESTOR" && (slug === "suggested" || slug === "similar")) {
      const companies = await prisma.companyProfile.findMany({
        where: {
          userId: { not: user.id },
          user: { accountType: "BUSINESS", status: "ACTIVE" },
        },
        take: 40,
        orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          userId: true,
          companyName: true,
          description: true,
          logoUrl: true,
          size: true,
          type: true,
          yearOfEstablishment: true,
          dealIn: true,
          website: true,
          location: true,
          lookingFor: true,
          isBoosted: true,
          user: {
            select: {
              image: true,
              _count: {
                select: {
                  followers: true,
                  receivedConnections: { where: { status: "ACCEPTED" } },
                  sentConnections: { where: { status: "ACCEPTED" } },
                },
              },
            },
          },
        },
      });
      const data = companies
        .map(({ user: companyUser, ...company }) => ({
          ...company,
          logoUrl: company.logoUrl || companyUser.image,
          followersCount: companyUser._count.followers,
          connectionsCount: companyUser._count.receivedConnections + companyUser._count.sentConnections,
          matchReason: "Business profile",
        }))
        .filter((c) => !hiddenIds.has(c.userId));
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    const { results, total, hasMore } = await getMatches(user.id, slug as MatchSlug, source, {
      page,
      limit,
      excludeUserIds: hiddenIds,
    });

    return NextResponse.json(
      { success: true, data: results, pagination: { page, limit, total, hasMore } },
      { status: 200 }
    );

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}