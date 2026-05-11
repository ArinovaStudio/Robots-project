import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [connections, totalCount] = await Promise.all([
      prisma.connection.findMany({
        where: { status: "ACCEPTED",
          OR: [ { senderId: user.id }, { receiverId: user.id } ]
        },
        skip, take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          sender: { select: { id: true, company: true } },
          receiver: { select: { id: true, company: true } }
        }
      }),
      prisma.connection.count({ where: { status: "ACCEPTED", OR: [{ senderId: user.id }, { receiverId: user.id }] } })
    ]);

    const formattedConnections = connections.map(conn => {
      const isSender = conn.senderId === user.id;
      const otherUser = isSender ? conn.receiver : conn.sender;

      return {
        connectionId: conn.id,
        connectedAt: conn.updatedAt,
        ...otherUser.company,
        userId: otherUser.id,
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