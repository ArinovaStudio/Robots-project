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
            { sender: { name: { contains: search, mode: "insensitive" } } },
            { receiver: { name: { contains: search, mode: "insensitive" } } },
            { sender: { company: { companyName: { contains: search, mode: "insensitive" } } } },
            { receiver: { company: { companyName: { contains: search, mode: "insensitive" } } } },
            { sender: { investor: { firmName: { contains: search, mode: "insensitive" } } } },
            { receiver: { investor: { firmName: { contains: search, mode: "insensitive" } } } }
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

    const getRoomId = (id1: string, id2: string) => [id1, id2].sort().join("_");

    const [unreadCounts, conversations] = await Promise.all([
      otherUserIds.length > 0 ? prisma.directMessage.groupBy({
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
      }) : [],
      otherUserIds.length > 0 ? prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: user.id, user2Id: { in: otherUserIds } },
            { user2Id: user.id, user1Id: { in: otherUserIds } },
          ]
        },
        select: {
          user1Id: true,
          user2Id: true,
          lastMessage: true,
          lastMessageAt: true,
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              senderId: true,
              content: true,
              mediaType: true,
              createdAt: true,
            }
          }
        }
      }) : []
    ]);

    const unreadCountMap = new Map<string, number>();
    unreadCounts.forEach(u => {
      unreadCountMap.set(u.senderId, u._count._all);
    });

    const conversationMap = new Map<string, { lastMessage: string | null; lastMessageAt: Date | null; lastSenderId: string | null }>();
    conversations.forEach(conv => {
      const latest = conv.messages?.[0];
      const messageText = latest
        ? (latest.content || (latest.mediaType === "VIDEO" ? "Video" : latest.mediaType === "PDF" ? "Document" : "Photo"))
        : conv.lastMessage;
      conversationMap.set(getRoomId(conv.user1Id, conv.user2Id), {
        lastMessage: messageText || null,
        lastMessageAt: latest?.createdAt || conv.lastMessageAt || null,
        lastSenderId: latest?.senderId || null,
      });
    });

    const formattedConnections = connections.map(conn => {
      const isSender = conn.senderId === user.id;
      const otherUser = isSender ? conn.receiver : conn.sender;
      const isOtherInvestor = otherUser.accountType === "INVESTOR";
      const conv = conversationMap.get(getRoomId(user.id, otherUser.id));

      const isLastSenderMe = conv?.lastSenderId === user.id;
      const otherFirstName = otherUser.name ? otherUser.name.split(" ")[0] : otherUser.company?.companyName || "Contact";
      let displayLastMessage = conv?.lastMessage || null;
      if (displayLastMessage && conv?.lastSenderId) {
        const prefix = isLastSenderMe ? "You" : otherFirstName;
        displayLastMessage = `${prefix}: ${displayLastMessage}`;
      }

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
        lastMessage: displayLastMessage,
        lastMessageAt: conv?.lastMessageAt || null,
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