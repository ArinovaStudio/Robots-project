import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleToViewer, notHiddenBy } from "@/lib/post-visibility";

const MAX_LOOKBACK_MS = 24 * 60 * 60 * 1000;
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const serverTime = new Date();
    const sinceParam = req.nextUrl.searchParams.get("since");

    if (!sinceParam) {
      return NextResponse.json({ success: true, count: 0, serverTime: serverTime.toISOString() });
    }

    let since = new Date(sinceParam);
    if (isNaN(since.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid since value" }, { status: 400 });
    }
    const oldest = new Date(serverTime.getTime() - MAX_LOOKBACK_MS);
    if (since < oldest) since = oldest;

    const connections = await prisma.connection.findMany({
      where: { status: "ACCEPTED", OR: [{ senderId: user.id }, { receiverId: user.id }] },
      select: { senderId: true, receiverId: true },
    });
    const connectionIds = connections.map((c) => (c.senderId === user.id ? c.receiverId : c.senderId));

    if (connectionIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, serverTime: serverTime.toISOString() });
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: user.id, followingId: { in: connectionIds } },
      select: { followingId: true },
    });
    const authorIds = follows.map((f) => f.followingId);

    const count = authorIds.length
      ? await prisma.post.count({
          where: {
            authorId: { in: authorIds },
            status: "ACTIVE",
            createdAt: { gt: since },
            AND: [visibleToViewer(user.id), notHiddenBy(user.id)],
          },
        })
      : 0;

    return NextResponse.json({ success: true, count, serverTime: serverTime.toISOString() });
  } catch (e) {
    console.error("NEW POSTS POLL ERROR:", e);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}