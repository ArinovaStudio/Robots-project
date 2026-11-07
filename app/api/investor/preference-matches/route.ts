import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    // Get current investor profile and preferences
    const investorProfile = await prisma.investorProfile.findUnique({
      where: { userId: user.id }
    });

    const sectors = investorProfile?.sectors || [];
    const stages = investorProfile?.stages || [];
    const investmentRange = investorProfile?.investmentRange || "Seed";

    // Query active companies
    const companies = await prisma.companyProfile.findMany({
      where: {
        user: { status: "ACTIVE" },
        ...(sectors.length > 0 ? {
          OR: [
            { type: { in: sectors } },
            { dealIn: { hasSome: sectors } }
          ]
        } : {})
      },
      take: 30,
      orderBy: [
        { isBoosted: "desc" },
        { createdAt: "desc" }
      ],
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
                receivedConnections: { where: { status: "ACCEPTED" } }
              }
            }
          }
        },
        profileViews: {
          take: 7,
          orderBy: { date: "desc" }
        }
      }
    });

    // If preference filter yielded few results, fallback to include top trending companies overall
    let candidateCompanies = companies;
    if (candidateCompanies.length < 5) {
      const additional = await prisma.companyProfile.findMany({
        where: {
          user: { status: "ACTIVE" },
          id: { notIn: candidateCompanies.map(c => c.id) }
        },
        take: 20,
        orderBy: [
          { isBoosted: "desc" },
          { createdAt: "desc" }
        ],
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
                  receivedConnections: { where: { status: "ACCEPTED" } }
                }
              }
            }
          },
          profileViews: {
            take: 7,
            orderBy: { date: "desc" }
          }
        }
      });
      candidateCompanies = [...candidateCompanies, ...additional];
    }

    // Fetch existing connections for the current user
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true
      }
    });

    const connectionMap = new Map<string, { status: string; connectionId: string; isSender: boolean }>();
    userConnections.forEach(c => {
      const otherId = c.senderId === user.id ? c.receiverId : c.senderId;
      connectionMap.set(otherId, {
        status: c.status,
        connectionId: c.id,
        isSender: c.senderId === user.id
      });
    });

    const companyUserIds = candidateCompanies.map((company) => company.userId);
    const pitchRows = await prisma.companyPitch.findMany({
      where: { userId: { in: companyUserIds } },
      select: { id: true, userId: true },
    });
    const pitchIds = pitchRows.map((pitch) => pitch.id);

    const [
      sentConnections,
      receivedConnections,
      authoredPosts,
      authoredComments,
      companyPitchCounts,
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
      prisma.companyPitch.groupBy({
        by: ["userId"],
        where: { userId: { in: companyUserIds } },
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

    const countMap = <TRow extends { _count: { _all: number } }>(
      rows: TRow[],
      key: (row: TRow) => string,
    ) => new Map(rows.map((row) => [key(row), row._count._all]));
    const sentConnectionsByUser = countMap(sentConnections, (row) => row.senderId);
    const receivedConnectionsByUser = countMap(receivedConnections, (row) => row.receiverId);
    const postsByUser = countMap(authoredPosts, (row) => row.authorId);
    const commentsByUser = countMap(authoredComments, (row) => row.authorId);
    const pitchesByUser = countMap(companyPitchCounts, (row) => row.userId);
    const userByPitchId = new Map(pitchRows.map((pitch) => [pitch.id, pitch.userId]));
    const investmentsByUser = new Map<string, number>();
    for (const offer of acceptedOfferCounts) {
      const pitchOwnerId = userByPitchId.get(offer.pitchId);
      if (pitchOwnerId) {
        investmentsByUser.set(
          pitchOwnerId,
          (investmentsByUser.get(pitchOwnerId) || 0) + offer._count._all,
        );
      }
    }

    // Score each company from its connections, posts, comments, pitches, and accepted investments.
    const formattedCompanies = candidateCompanies.map(c => {
      const followersCount = c.user._count.followers;
      const connectionsCount = c.user._count.sentConnections + c.user._count.receivedConnections;
      const recentViews = c.profileViews.reduce((sum, v) => sum + v.count, 0);
      const isVerified = c.user.verificationStatus === "VERIFIED";

      const acceptedConnections =
        (sentConnectionsByUser.get(c.userId) || 0) +
        (receivedConnectionsByUser.get(c.userId) || 0);
      const performanceScore =
        acceptedConnections +
        (postsByUser.get(c.userId) || 0) +
        (commentsByUser.get(c.userId) || 0) +
        (pitchesByUser.get(c.userId) || 0) +
        (investmentsByUser.get(c.userId) || 0);

      // Check preference sector match
      const sectorMatched = sectors.some(s =>
        s.toLowerCase() === c.type.toLowerCase() ||
        c.dealIn.some(d => d.toLowerCase().includes(s.toLowerCase()))
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
          followers: followersCount,
          connections: connectionsCount,
          recentViews
        },
        performanceScore,
        matchPercentage,
        badges,
        connectionStatus: connInfo?.status || null,
        connectionId: connInfo?.connectionId || null,
        isConnectionSender: connInfo?.isSender || false,
      };
    });

    // Sort by performance score descending
    formattedCompanies.sort((a, b) => b.performanceScore - a.performanceScore);

    return NextResponse.json({
      success: true,
      preferences: {
        sectors,
        stages,
        investmentRange
      },
      data: formattedCompanies
    });

  } catch (error) {
    console.error("Failed to fetch preference matches:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
