import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      select: { id: true, userId: true }
    });

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No expired subscriptions to process" });
    }

    const expiredSubIds = expiredSubscriptions.map(sub => sub.id);
    const expiredUserIds = expiredSubscriptions.map(sub => sub.userId);

    // Only remove boost for users with NO remaining active subscriptions
    const usersToUnboost: string[] = [];
    for (const userId of expiredUserIds) {
      const otherActiveSub = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", id: { notIn: expiredSubIds } }
      });
      if (!otherActiveSub) usersToUnboost.push(userId);
    }

    await prisma.$transaction([

      prisma.subscription.updateMany({
        where: { id: { in: expiredSubIds } },
        data: { status: "EXPIRED" }
      }),
      
      ...(usersToUnboost.length > 0 ? [
        prisma.companyProfile.updateMany({
          where: { userId: { in: usersToUnboost } },
          data: { isBoosted: false }
        })
      ] : [])
    ]);

    return NextResponse.json({ success: true, message: `Successfully expired ${expiredSubscriptions.length}` }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}