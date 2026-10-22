import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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
            { type: { in: sectors, mode: "insensitive" } },
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
        senderId: true,
        receiverId: true,
        status: true
      }
    });

    const connectionMap = new Map<string, string>();
    userConnections.forEach(c => {
      const otherId = c.senderId === user.id ? c.receiverId : c.senderId;
      connectionMap.set(otherId, c.status);
    });

    // Score and format each company
    const formattedCompanies = candidateCompanies.map(c => {
      const followersCount = c.user._count.followers;
      const connectionsCount = c.user._count.sentConnections + c.user._count.receivedConnections;
      const recentViews = c.profileViews.reduce((sum, v) => sum + v.count, 0);
      const isVerified = c.user.verificationStatus === "VERIFIED";

      // Calculate performance score ("doing good" metric)
      const performanceScore =
        (recentViews * 3) +
        (followersCount * 2) +
        (connectionsCount * 3) +
        (c.isBoosted ? 30 : 0) +
        (isVerified ? 40 : 15);

      // Check preference sector match
      const sectorMatched = sectors.some(s =>
        s.toLowerCase() === c.type.toLowerCase() ||
        c.dealIn.some(d => d.toLowerCase().includes(s.toLowerCase()))
      );

      const matchPercentage = sectorMatched
        ? Math.min(99, 88 + Math.floor(Math.random() * 10))
        : Math.min(88, 75 + Math.floor(Math.random() * 10));

      const badges: string[] = [];
      if (isVerified) badges.push("Verified Business");
      if (c.isBoosted) badges.push("Trending Partner");
      if (recentViews > 5 || performanceScore > 50) badges.push("High Growth & Visibility");
      if (sectorMatched) badges.push(`Matches ${c.type}`);

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
        connectionStatus: connectionMap.get(c.userId) || null
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
