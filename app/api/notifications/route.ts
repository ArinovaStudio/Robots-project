import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const INVESTOR_LINKS = ["/company/pitches", "/investors/portal"];

/** Which tab (besides "All") a notification belongs to. */
function categoryOf(n: { type: string; link: string | null; content?: string }): "INVESTORS" | "MY_POSTS" | "MENTIONS" | null {
  if (n.type === "MENTION") return "MENTIONS";
  if (n.type === "POST_LIKE" || n.type === "NEW_COMMENT") return "MY_POSTS";
  // Pitch requests or investor offers belong to INVESTORS tab
  if (
    n.type === "INVESTOR_OFFER" ||
    (n.type === "SYSTEM" && n.link && INVESTOR_LINKS.includes(n.link)) ||
    (n.content && (n.content.toLowerCase().includes("pitch request") || n.content.toLowerCase().includes("sent you a pitch"))) ||
    (n.link && n.link.includes("pitchRequestId"))
  ) {
    return "INVESTORS";
  }
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

    // Check if any notifications could be pitch requests
    const hasPitchNotif = notifications.some(
      (n) =>
        (n.link && n.link.includes("pitchRequestId")) ||
        (n.content && n.content.toLowerCase().includes("pitch request")) ||
        (n.content && n.content.toLowerCase().includes("sent you a pitch"))
    );

    let pitchRequests: any[] = [];
    if (hasPitchNotif) {
      pitchRequests = await prisma.pitchRequest.findMany({
        where: {
          OR: [
            { investorId: session.user.id },
            { senderId: session.user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              company: { select: { companyName: true, logoUrl: true } },
            },
          },
        },
      });
    }

    const pitchMapById = new Map(pitchRequests.map((p) => [p.id, p]));
    const pitchesBySender = new Map<string, any[]>();
    for (const p of pitchRequests) {
      const list = pitchesBySender.get(p.senderId) || [];
      list.push(p);
      pitchesBySender.set(p.senderId, list);
    }

    const data = notifications.map((n) => {
      let pitchRequest = null;
      if (
        (n.link && n.link.includes("pitchRequestId")) ||
        (n.content && n.content.toLowerCase().includes("pitch request")) ||
        (n.content && n.content.toLowerCase().includes("sent you a pitch"))
      ) {
        if (n.link && n.link.includes("pitchRequestId=")) {
          const match = n.link.match(/pitchRequestId=([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            pitchRequest = pitchMapById.get(match[1]) || null;
          }
        }
        if (!pitchRequest && n.actorId) {
          const candidates = pitchesBySender.get(n.actorId);
          if (candidates && candidates.length > 0) {
            const notifTime = new Date(n.createdAt).getTime();
            pitchRequest = candidates.reduce((prev, curr) => {
              const prevDiff = Math.abs(new Date(prev.createdAt).getTime() - notifTime);
              const currDiff = Math.abs(new Date(curr.createdAt).getTime() - notifTime);
              return currDiff < prevDiff ? curr : prev;
            });
          }
        }
      }

      return {
        ...n,
        category: categoryOf(n),
        actor: n.actorId ? actorMap.get(n.actorId) ?? null : null,
        pitchRequest: pitchRequest
          ? {
              id: pitchRequest.id,
              senderId: pitchRequest.senderId,
              companyName: pitchRequest.companyName,
              problemStatement: pitchRequest.problemStatement,
              proposedSolution: pitchRequest.proposedSolution,
              fundingRequirement: pitchRequest.fundingRequirement,
              equityOffered: pitchRequest.equityOffered,
              message: pitchRequest.message,
              pitchDeckUrl: pitchRequest.pitchDeckUrl,
              status: pitchRequest.status,
              createdAt: pitchRequest.createdAt,
              sender: pitchRequest.sender || null,
            }
          : null,
      };
    });

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
