import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Business Collaboration (I2B): every active business profile, newest page first,
// loaded in small pages so the client can infinite-scroll. Independent of pitches;
// pitch-related filters only narrow the list when the investor asks for them.

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;
const PITCH_TYPES = ["PITCH", "PRODUCT", "IDEA"] as const;

// A pitch counts for filtering only when it is visible in Company Pitches.
const LIVE_PITCH = { status: "ACTIVE", isSharedWithCompanies: true } as const;

const clean = (value: string | null) => {
  const v = (value || "").trim();
  return !v || v.toUpperCase() === "ALL" ? null : v;
};

// Boosted businesses first, then newest; id keeps the order stable between pages.
const ORDER_BY: Prisma.CompanyProfileOrderByWithRelationInput[] = [
  { isBoosted: "desc" },
  { createdAt: "desc" },
  { id: "asc" },
];

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType === "INVESTOR" && user.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        { success: false, message: "Account verification is required to access this section." },
        { status: 403 }
      );
    }


    const sp = req.nextUrl.searchParams;
    const offset = Math.max(parseInt(sp.get("offset") || "0", 10) || 0, 0);
    const limit = Math.min(
      Math.max(parseInt(sp.get("limit") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );
    const stage = clean(sp.get("stage"));
    const sector = clean(sp.get("sector"));
    const industry = clean(sp.get("industry"));
    const rawType = clean(sp.get("pitchType"))?.toUpperCase() ?? null;
    const pitchType = PITCH_TYPES.find((t) => t === rawType) ?? null;
    const q = (sp.get("q") || "").trim().slice(0, 100);

    const and: Prisma.CompanyProfileWhereInput[] = [];
    if (q) {
      and.push({ companyName: { contains: q, mode: "insensitive" } });
    }
    if (industry) {
      and.push({ type: { equals: industry, mode: "insensitive" } });
    }
    if (sector) {
      // Sector is the sector chosen on a business's live pitch
      and.push({
        user: {
          companyPitches: {
            some: { ...LIVE_PITCH, sector: { contains: sector, mode: "insensitive" } },
          },
        },
      });
    }
    if (stage || pitchType) {
      // Stage and pitch type must match on the same pitch.
      and.push({
        user: {
          companyPitches: {
            some: {
              ...LIVE_PITCH,
              ...(stage ? { stage: { equals: stage, mode: "insensitive" as const } } : {}),
              ...(pitchType ? { type: pitchType } : {}),
            },
          },
        },
      });
    }

    const rows = await prisma.companyProfile.findMany({
      where: {
        user: { status: "ACTIVE", accountType: "BUSINESS" },
        ...(and.length ? { AND: and } : {}),
      },
      skip: offset,
      take: limit + 1, // one extra row tells us whether another page exists
      orderBy: ORDER_BY,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            verificationStatus: true,
            _count: {
              select: {
                followers: true,
                sentConnections: { where: { status: "ACCEPTED" } },
                receivedConnections: { where: { status: "ACCEPTED" } },
              },
            },
          },
        },
        profileViews: { take: 7, orderBy: { date: "desc" } },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const companyUserIds = page.map((c) => c.userId);

    if (companyUserIds.length === 0) {
      return NextResponse.json({ success: true, data: [], hasMore: false, nextOffset: offset });
    }

    const [investorProfile, userConnections, pitchRows] = await Promise.all([
      prisma.investorProfile.findUnique({ where: { userId: user.id }, select: { sectors: true } }),
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: { in: companyUserIds } },
            { receiverId: user.id, senderId: { in: companyUserIds } },
          ],
        },
        select: { id: true, senderId: true, receiverId: true, status: true },
      }),
      prisma.companyPitch.findMany({
        where: { userId: { in: companyUserIds } },
        select: { id: true, userId: true, type: true, stage: true, status: true, isSharedWithCompanies: true },
      }),
    ]);
    const sectors = investorProfile?.sectors || [];

    const connectionMap = new Map<string, { status: string; connectionId: string; isSender: boolean }>();
    userConnections.forEach((c) => {
      const otherId = c.senderId === user.id ? c.receiverId : c.senderId;
      connectionMap.set(otherId, {
        status: c.status,
        connectionId: c.id,
        isSender: c.senderId === user.id,
      });
    });

    const pitchIds = pitchRows.map((p) => p.id);
    const [
      sentConnections,
      receivedConnections,
      authoredPosts,
      authoredComments,
      acceptedOfferCounts,
    ] = await Promise.all([
      prisma.connection.groupBy({
        by: ["senderId"],
        where: { status: "ACCEPTED", senderId: { in: companyUserIds } },
        _count: { _all: true },
      }),
      prisma.connection.groupBy({
        by: ["receiverId"],
        where: { status: "ACCEPTED", receiverId: { in: companyUserIds } },
        _count: { _all: true },
      }),
      prisma.post.groupBy({
        by: ["authorId"],
        where: { authorId: { in: companyUserIds }, status: "ACTIVE" },
        _count: { _all: true },
      }),
      prisma.comment.groupBy({
        by: ["authorId"],
        where: { authorId: { in: companyUserIds } },
        _count: { _all: true },
      }),
      pitchIds.length
        ? prisma.companyPitchOffer.groupBy({
            by: ["pitchId"],
            where: { pitchId: { in: pitchIds }, status: "ACCEPTED" },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const countMap = <T extends { _count: { _all: number } }>(rows: T[], key: (row: T) => string) =>
      new Map(rows.map((row) => [key(row), row._count._all]));
    const sentByUser = countMap(sentConnections, (r) => r.senderId);
    const receivedByUser = countMap(receivedConnections, (r) => r.receiverId);
    const postsByUser = countMap(authoredPosts, (r) => r.authorId);
    const commentsByUser = countMap(authoredComments, (r) => r.authorId);

    const pitchCountByUser = new Map<string, number>();
    const livePitchesByUser = new Map<string, { type: string; stage: string }[]>();
    const ownerByPitchId = new Map<string, string>();
    pitchRows.forEach((p) => {
      ownerByPitchId.set(p.id, p.userId);
      pitchCountByUser.set(p.userId, (pitchCountByUser.get(p.userId) || 0) + 1);
      if (p.status === "ACTIVE" && p.isSharedWithCompanies) {
        const list = livePitchesByUser.get(p.userId) || [];
        list.push({ type: p.type, stage: p.stage });
        livePitchesByUser.set(p.userId, list);
      }
    });
    const investmentsByUser = new Map<string, number>();
    acceptedOfferCounts.forEach((offer) => {
      const ownerId = ownerByPitchId.get(offer.pitchId);
      if (ownerId) {
        investmentsByUser.set(ownerId, (investmentsByUser.get(ownerId) || 0) + offer._count._all);
      }
    });

    const data = page.map((c) => {
      const connectionsCount = c.user._count.sentConnections + c.user._count.receivedConnections;
      const recentViews = c.profileViews.reduce((sum, v) => sum + v.count, 0);
      const isVerified = c.user.verificationStatus === "VERIFIED";

      const performanceScore =
        (sentByUser.get(c.userId) || 0) +
        (receivedByUser.get(c.userId) || 0) +
        (postsByUser.get(c.userId) || 0) +
        (commentsByUser.get(c.userId) || 0) +
        (pitchCountByUser.get(c.userId) || 0) +
        (investmentsByUser.get(c.userId) || 0);

      const sectorMatched = sectors.some(
        (s) =>
          s.toLowerCase() === c.type.toLowerCase() ||
          c.dealIn.some((d) => d.toLowerCase().includes(s.toLowerCase())),
      );
      const idHash = c.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const matchOffset = idHash % 10;
      const matchPercentage = sectorMatched
        ? Math.min(99, 89 + matchOffset)
        : Math.min(88, 75 + matchOffset);

      const badges: string[] = [];
      if (isVerified) badges.push("Verified Business");
      if (c.isBoosted) badges.push("Trending Partner");
      if (recentViews > 5 || performanceScore > 50) badges.push("High Growth & Visibility");
      if (sectorMatched) badges.push(`Matches ${c.type}`);

      const live = livePitchesByUser.get(c.userId) || [];
      const connInfo = connectionMap.get(c.userId);

      return {
        id: c.id,
        userId: c.userId,
        companyName: c.companyName,
        logoUrl: c.logoUrl || c.user.image,
        type: c.type,
        dealIn: c.dealIn,
        lookingFor: c.lookingFor,
        size: c.size,
        yearOfEstablishment: c.yearOfEstablishment,
        location: c.location,
        description: c.description,
        isBoosted: c.isBoosted,
        isVerified,
        stats: {
          followers: c.user._count.followers,
          connections: connectionsCount,
          recentViews,
        },
        performanceScore,
        matchPercentage,
        badges,
        pitchTypes: [...new Set(live.map((p) => p.type))],
        fundingStages: [...new Set(live.map((p) => p.stage))],
        connectionStatus: connInfo?.status || null,
        connectionId: connInfo?.connectionId || null,
        isConnectionSender: connInfo?.isSender || false,
      };
    });

    return NextResponse.json({ success: true, data, hasMore, nextOffset: offset + page.length });
  } catch (error) {
    console.error("Failed to fetch businesses for investor:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
