import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const whereClause: any = {
      status: "ACCEPTED",
      OR: [ { senderId: user.id }, { receiverId: user.id } ]
    };

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { sender: { company: { companyName: { contains: search, mode: "insensitive" } } } },
            { receiver: { company: { companyName: { contains: search, mode: "insensitive" } } } }
          ]
        }
      ];
    }

    const [connections, totalCount] = await Promise.all([
      prisma.connection.findMany({
        where: whereClause,
        skip, 
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, image: true, accountType: true, company: true, investor: true } },
          receiver: { select: { id: true, name: true, image: true, accountType: true, company: true, investor: true } }
        }
      }),
      prisma.connection.count({ where: whereClause })
    ]);

    const otherUserIds = connections.map(conn => conn.senderId === user.id ? conn.receiverId : conn.senderId);

    const unreadCounts = otherUserIds.length > 0 ? await prisma.directMessage.groupBy({
      by: ['senderId'],
      where: {
        senderId: { in: otherUserIds },
        isRead: false,
        isDeleted: false,
        conversation: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      },
      _count: {
        _all: true
      }
    }) : [];

    const unreadCountMap = new Map<string, number>();
    unreadCounts.forEach(u => {
      unreadCountMap.set(u.senderId, u._count._all);
    });

    const formattedConnections = connections.map(conn => {
      const isSender = conn.senderId === user.id;
      const otherUser = isSender ? conn.receiver : conn.sender;
      const isOtherInvestor = otherUser.accountType === "INVESTOR";

      return {
        id: conn.id,
        connectionId: conn.id,
        connectedAt: conn.updatedAt,
        name: isOtherInvestor
          ? (otherUser.name || otherUser.investor?.firmName || "Investor")
          : (otherUser.company?.companyName || otherUser.name || "Unknown Company"),
        company: otherUser.company,
        investor: otherUser.investor,
        accountType: otherUser.accountType,
        image: otherUser.image || otherUser.company?.logoUrl || null,
        userId: otherUser.id,
        unreadCount: unreadCountMap.get(otherUser.id) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedConnections,
      pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}