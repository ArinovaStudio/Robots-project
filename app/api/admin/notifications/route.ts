import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") || "ALL";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const [
      pendingVerifications,
      pendingReports,
      totalVerifications,
      totalReports,
      totalBroadcasts,
      recentVerifications,
      recentReports,
      recentBroadcasts,
    ] = await Promise.all([
      prisma.verificationApplication.count({ where: { status: "PENDING" } }),
      prisma.postReport.count({ where: { status: "PENDING" } }),
      prisma.verificationApplication.count(),
      prisma.postReport.count(),
      prisma.notification.count({ where: { type: "SYSTEM" } }),
      prisma.verificationApplication.findMany({
        take: 40,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          fullName: true,
          username: true,
          email: true,
          accountType: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.postReport.findMany({
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          post: { select: { id: true, content: true, author: { select: { name: true } } } },
        },
      }),
      prisma.notification.findMany({
        where: { type: "SYSTEM" },
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    const notifications: Array<{
      id: string;
      rawId: string;
      category: "VERIFICATION" | "REPORT" | "BROADCAST";
      type: string;
      title: string;
      message: string;
      status: string;
      timestamp: Date;
      user: { name: string; email: string; role?: string };
      link: string;
      actionLabel?: string;
    }> = [];

    // 1. Verifications
    for (const v of recentVerifications) {
      notifications.push({
        id: `verif-${v.id}`,
        rawId: v.id,
        category: "VERIFICATION",
        type: "VERIFICATION",
        title: `Verification Request: ${v.fullName || v.username}`,
        message: `Account type: ${v.accountType}. Application is currently ${v.status.toLowerCase()}.`,
        status: v.status,
        timestamp: v.createdAt,
        user: { name: v.fullName || v.username, email: v.email },
        link: "/admin/verifications",
        actionLabel: "Review Application",
      });
    }

    // 2. Reports
    for (const r of recentReports) {
      const snippet = r.post?.content
        ? r.post.content.length > 80
          ? r.post.content.slice(0, 80) + "..."
          : r.post.content
        : "Post content unavailable";
      notifications.push({
        id: `report-${r.id}`,
        rawId: r.id,
        category: "REPORT",
        type: "REPORT",
        title: `Reported Post (${r.reason})`,
        message: `Reported by ${r.user?.name || "User"}: "${snippet}"`,
        status: r.status,
        timestamp: r.createdAt,
        user: { name: r.user?.name || "Reporter", email: r.user?.email || "" },
        link: "/admin/reports",
        actionLabel: "Moderate Post",
      });
    }

    // 3. Broadcasts / System
    for (const b of recentBroadcasts) {
      notifications.push({
        id: `sys-${b.id}`,
        rawId: b.id,
        category: "BROADCAST",
        type: "SYSTEM",
        title: "Platform Broadcast Notification",
        message: b.content,
        status: "DELIVERED",
        timestamp: b.createdAt,
        user: {
          name: b.user?.name || "Recipient",
          email: b.user?.email || "",
          role: b.user?.role,
        },
        link: b.link || "/admin/notifications",
        actionLabel: b.link ? "View Link" : undefined,
      });
    }

    // Sort by timestamp desc
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply category filter if requested
    let filtered = notifications;
    if (category !== "ALL") {
      filtered = filtered.filter((n) => n.category === category);
    }

    // Apply search filter if provided
    if (search) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search) ||
          n.user.name.toLowerCase().includes(search) ||
          n.user.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingVerifications,
        pendingReports,
        totalVerifications,
        totalReports,
        totalBroadcasts,
        totalNotifications: filtered.length,
        notifications: filtered,
      },
    });
  } catch (error) {
    console.error("Failed to load admin notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, message, targetRole = "ALL", link } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title and message are required." },
        { status: 400 }
      );
    }

    const where: { accountType?: "BUSINESS" | "INVESTOR" } = {};
    if (targetRole === "FOUNDER" || targetRole === "BUSINESS") {
      where.accountType = "BUSINESS";
    } else if (targetRole === "INVESTOR") {
      where.accountType = "INVESTOR";
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users matched the criteria.",
        count: 0,
      });
    }

    const content = `${title.trim()}: ${message.trim()}`;

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        actorId: user.id,
        type: "SYSTEM" as const,
        content,
        link: link?.trim() || undefined,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully sent to ${users.length} ${targetRole.toLowerCase()} user${users.length === 1 ? "" : "s"}.`,
      count: users.length,
    });
  } catch (error) {
    console.error("Failed to broadcast admin notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Notification ID required" },
        { status: 400 }
      );
    }

    const cleanId = id.replace(/^(sys|verif|report)-/, "");

    const exists = await prisma.notification.findUnique({
      where: { id: cleanId },
    });
    if (exists) {
      await prisma.notification.delete({ where: { id: cleanId } });
      return NextResponse.json({
        success: true,
        message: "Notification dismissed successfully.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Item cleared from view.",
    });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
