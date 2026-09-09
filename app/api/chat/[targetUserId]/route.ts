import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET( req: NextRequest, { params }: { params: Promise<{ targetUserId: string }> } ) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const { targetUserId } = await params;

    if (user.id === targetUserId) {
      return NextResponse.json({ success: false, message: "You cannot chat with yourself" }, { status: 400 });
    }

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id }
        ],
        status: "ACCEPTED"
      }
    });

    if (!connection) {
      return NextResponse.json({ success: false, message: "You can only chat with accepted connections" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        company: { select: { logoUrl: true, companyName: true } }
      }
    });

    const [user1Id, user2Id] = [user.id, targetUserId].sort();
    
    const conversation = await prisma.conversation.findUnique({ where: { user1Id_user2Id: { user1Id, user2Id } } });

    let messages: any[] = [];
    let totalCount = 0;

    if (conversation) {
      const [fetchedMessages, count] = await Promise.all([
        prisma.directMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            sender: { select: { id: true, name: true, company: { select: { logoUrl: true } } } }
          }
        }),
        prisma.directMessage.count({ where: { conversationId: conversation.id } })
      ]);

      totalCount = count;
      
      messages = fetchedMessages.reverse();

      if (page === 1) {
        await prisma.directMessage.updateMany({
          where: { conversationId: conversation.id, senderId: targetUserId, isRead: false },
          data: { isRead: true }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        targetUser, 
        messages,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      } 
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}