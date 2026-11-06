import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const INVESTOR_LINKS = ["/company/pitches", "/investors/portal"];

/** Which tab (besides "All") a notification belongs to. */
function categoryOf(n: { type: string; link: string | null }): "INVESTORS" | "MY_POSTS" | "MENTIONS" | null {
  if (n.type === "MENTION") return "MENTIONS";
  if (n.type === "POST_LIKE" || n.type === "NEW_COMMENT") return "MY_POSTS";
  // Older offer notifications were stored as SYSTEM, so also match them by link
  if (n.type === "INVESTOR_OFFER" || (n.type === "SYSTEM" && n.link && INVESTOR_LINKS.includes(n.link))) return "INVESTORS";
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const actorIds = Array.from(
      new Set(notifications.map((n) => n.actorId).filter((id): id is string => !!id))
    );

    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: {
            id: true,
            name: true,
            image: true,
            company: { select: { logoUrl: true, companyName: true } },
          },
        })
      : [];

    const actorMap = new Map(
      actors.map((a) => [
        a.id,
        {
          id: a.id,
          name: a.company?.companyName || a.name || "User",
          image: a.company?.logoUrl || a.image || null,
        },
      ])
    );

    const data = notifications.map((n) => ({
      ...n,
      category: categoryOf(n),
      actor: n.actorId ? actorMap.get(n.actorId) ?? null : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const notificationId = searchParams.get("id");

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: session.user.id },
        data: { isRead: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
