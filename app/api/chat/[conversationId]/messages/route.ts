import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET( req: NextRequest, { params }: { params: Promise<{ conversationId: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);
    
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const cursor = searchParams.get("cursor");

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });

    if (!conversation || (conversation.user1Id !== user.id && conversation.user2Id !== user.id)) {
      return NextResponse.json({ success: false, message: "Unauthorized access to chat" }, { status: 403 });
    }

    const queryPayload: any = {
      where: { conversationId },
      take: limit, 
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { 
          select: { 
            id: true, 
            name: true, 
            image: true,
            company: { select: { logoUrl: true, companyName: true } }
          } 
        }
      }
    };

    if (cursor) {
      queryPayload.cursor = { id: cursor };
      queryPayload.skip = 1;
    }

    const messages = await prisma.directMessage.findMany(queryPayload);

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        nextCursor,
        hasMore: nextCursor !== null
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}