import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const [connections, conversations] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [{ senderId: user.id }, { receiverId: user.id }],
          status: "ACCEPTED"
        },
        select: { senderId: true, receiverId: true, createdAt: true }
      }),
      prisma.conversation.findMany({
        where: {
          OR: [{ user1Id: user.id }, { user2Id: user.id }]
        },
        select: {
          id: true,
          user1Id: true,
          user2Id: true,
          lastMessage: true,
          lastMessageAt: true,
          messages: {
            where: { senderId: { not: user.id }, isRead: false },
            select: { id: true }
          }
        }
      })
    ]);

    if (connections.length === 0) {
      return NextResponse.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
    }

    const getRoomId = (id1: string, id2: string) => [id1, id2].sort().join("_");

    const conversationMap = new Map();
    conversations.forEach(conv => {
      conversationMap.set(getRoomId(conv.user1Id, conv.user2Id), conv);
    });

    const mergedInboxMeta = connections.map(conn => {
      const partnerId = conn.senderId === user.id ? conn.receiverId : conn.senderId;
      const conv = conversationMap.get(getRoomId(user.id, partnerId));

      return {
        partnerId,
        conversationId: conv?.id || null,
        lastMessage: conv?.lastMessage || null,
        lastMessageAt: conv?.lastMessageAt || conn.createdAt,
      };
    });

    mergedInboxMeta.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    const totalCount = mergedInboxMeta.length;
    const paginatedMeta = mergedInboxMeta.slice(skip, skip + limit);

    const partnerIdsToFetch = paginatedMeta.map(item => item.partnerId);

    const richPartnerProfiles = await prisma.user.findMany({
      where: { id: { in: partnerIdsToFetch } },
      select: {
        id: true,
        name: true,
        image: true,
        company: { select: { companyName: true, logoUrl: true } }
      }
    });

    const profileMap = new Map(richPartnerProfiles.map(p => [p.id, p]));

    const finalInbox = paginatedMeta.map(meta => ({
      partner: profileMap.get(meta.partnerId),
      conversationId: meta.conversationId,
      lastMessage: meta.lastMessage,
      lastMessageAt: meta.lastMessageAt
    }));

    return NextResponse.json({
      success: true,
      data: finalInbox,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}