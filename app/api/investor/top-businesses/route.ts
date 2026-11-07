import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "INVESTOR") {
      return NextResponse.json({ success: false, message: "Investor account required" }, { status: 403 });
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
      select: { senderId: true, receiverId: true },
    });
    const excludedIds = new Set([user.id]);
    for (const connection of connections) {
      excludedIds.add(connection.senderId === user.id ? connection.receiverId : connection.senderId);
    }

    const businesses = await prisma.user.findMany({
      where: {
        accountType: "BUSINESS",
        status: "ACTIVE",
        company: { isNot: null },
        id: { notIn: [...excludedIds] },
      },
      take: 4,
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
