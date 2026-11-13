import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "INVESTOR") {
      return NextResponse.json({ success: false, message: "Investor account required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "4", 10) || 4, 1), 10);
    const excludeParam = (searchParams.get("exclude") || "").split(",").filter(Boolean);

    const [connections, follows] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id },
          ],
        },
        select: { senderId: true, receiverId: true },
      }),
      prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      }),
    ]);

    const excludedIds = new Set<string>([user.id, ...excludeParam]);
    for (const connection of connections) {
      excludedIds.add(connection.senderId === user.id ? connection.receiverId : connection.senderId);
    }
    for (const follow of follows) {
      excludedIds.add(follow.followingId);
    }

    const businesses = await prisma.user.findMany({
      where: {
        accountType: "BUSINESS",
        status: "ACTIVE",
        company: { isNot: null },
        id: { notIn: [...excludedIds] },
      },
      take: limit,
      orderBy: [
        { verificationStatus: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        image: true,
        verificationStatus: true,
        company: {
          select: {
            companyName: true,
            logoUrl: true,
            type: true,
            location: true,
            description: true,
          },
        },
        _count: {
          select: {
            sentConnections: { where: { status: "ACCEPTED" } },
            receivedConnections: { where: { status: "ACCEPTED" } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: businesses.map((business) => ({
        id: business.id,
        name: business.company?.companyName || business.name || "Business",
        image: business.company?.logoUrl || business.image,
        verificationStatus: business.verificationStatus,
        type: business.company?.type || "Business",
        location: business.company?.location || null,
        description: business.company?.description || "",
        connectedCount:
          business._count.sentConnections + business._count.receivedConnections,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch top businesses for investor:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
