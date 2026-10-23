import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user: currentUser } = await getUser().catch(() => ({ user: null }));

    const investors = await prisma.user.findMany({
      where: {
        accountType: "INVESTOR",
        status: "ACTIVE",
        investor: { isNot: null },
        ...(currentUser?.id ? { id: { not: currentUser.id } } : {}),
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
        investor: {
          select: {
            id: true,
            investorType: true,
            firmName: true,
            sectors: true,
            stages: true,
            investmentRange: true,
            location: true,
            city: true,
            country: true,
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

    const connectionMap = new Map<string, string>();
    if (currentUser?.id && investors.length > 0) {
      const investorIds = investors.map((inv) => inv.id);
      const connections = await prisma.connection.findMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: { in: investorIds } },
            { receiverId: currentUser.id, senderId: { in: investorIds } },
          ],
        },
        select: {
          senderId: true,
          receiverId: true,
          status: true,
        },
      });

      for (const conn of connections) {
        const partnerId = conn.senderId === currentUser.id ? conn.receiverId : conn.senderId;
        connectionMap.set(partnerId, conn.status);
      }
    }

    const formatted = investors.map((inv) => {
      const location = inv.investor?.city
        ? `${inv.investor.city}${inv.investor.country ? `, ${inv.investor.country}` : ""}`
        : inv.investor?.location || null;

      return {
        id: inv.id,
        name: inv.name || "Investor",
        image: inv.image,
        verificationStatus: inv.verificationStatus,
        firmName: inv.investor?.firmName || null,
        investorType: inv.investor?.investorType || "Investor",
        sectors: inv.investor?.sectors || [],
        investmentRange: inv.investor?.investmentRange || null,
        location,
        connectedCount: (inv._count?.sentConnections || 0) + (inv._count?.receivedConnections || 0),
        connectionStatus: connectionMap.get(inv.id) || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Failed to fetch top investors:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
