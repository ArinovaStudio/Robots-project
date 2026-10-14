import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

type MonthlyCount = { month: Date; count: number };

function getActivityTime(date: Date, now: Date) {
  const elapsed = now.getTime() - date.getTime();
  const minutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export async function GET() {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 403 },
      );
    }

    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const previousComparisonEnd = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - 1,
      now.getUTCDate() + 1,
    ));
    const chartStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const [
      totalUsers,
      totalCompanies,
      totalInvestors,
      totalConnections,
      totalRevenue,
      totalPosts,
      totalComments,
      totalMessages,
      totalSavedPosts,
      boostedProfiles,
      usersToday,
      companiesToday,
      successfulPaymentsToday,
      messagesToday,
      usersCurrentMonth,
      usersPreviousMonth,
      companiesCurrentMonth,
      companiesPreviousMonth,
      connectionsCurrentMonth,
      connectionsPreviousMonth,
      revenueCurrentMonth,
      revenuePreviousMonth,
      monthlyUsers,
      monthlyCompanies,
      monthlyConnections,
      monthlyRevenue,
      recentUsers,
      recentCompanies,
      recentTransactions,
      recentMessages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.companyProfile.count(),
      prisma.investorProfile.count(),
      prisma.connection.count({ where: { status: "ACCEPTED" } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS", currency: "INR" },
      }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.directMessage.count(),
      prisma.savedPost.count(),
      prisma.companyProfile.count({ where: { isBoosted: true } }),
      prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.companyProfile.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.transaction.count({
        where: { status: "SUCCESS", createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.directMessage.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.user.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: previousMonth, lt: previousComparisonEnd } } }),
      prisma.companyProfile.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.companyProfile.count({ where: { createdAt: { gte: previousMonth, lt: previousComparisonEnd } } }),
      prisma.connection.count({
        where: { status: "ACCEPTED", createdAt: { gte: currentMonth } },
      }),
      prisma.connection.count({
        where: { status: "ACCEPTED", createdAt: { gte: previousMonth, lt: previousComparisonEnd } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS", currency: "INR", createdAt: { gte: currentMonth } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS", currency: "INR", createdAt: { gte: previousMonth, lt: previousComparisonEnd } },
      }),
      prisma.$queryRaw<MonthlyCount[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${chartStart}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<MonthlyCount[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "CompanyProfile"
        WHERE "createdAt" >= ${chartStart}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<MonthlyCount[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "Connection"
        WHERE "createdAt" >= ${chartStart} AND status = 'ACCEPTED'
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<MonthlyCount[]>`
        SELECT date_trunc('month', "createdAt") AS month, COALESCE(SUM(amount), 0)::double precision AS count
        FROM "Transaction"
        WHERE "createdAt" >= ${chartStart} AND status = 'SUCCESS' AND currency = 'INR'
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { name: true, email: true, createdAt: true },
      }),
      prisma.companyProfile.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { companyName: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        where: { status: "SUCCESS" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { amount: true, currency: true, createdAt: true },
      }),
      prisma.directMessage.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const monthKey = (date: Date) =>
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const countByMonth = (rows: MonthlyCount[]) =>
      new Map(rows.map((row) => [monthKey(new Date(row.month)), Number(row.count)]));
    const userCounts = countByMonth(monthlyUsers);
    const companyCounts = countByMonth(monthlyCompanies);
    const connectionCounts = countByMonth(monthlyConnections);
    const revenueCounts = countByMonth(monthlyRevenue);

    const growth = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
      const key = monthKey(monthDate);
      return {
        month: monthDate.toLocaleDateString("en", { month: "short", year: "2-digit", timeZone: "UTC" }),
        users: userCounts.get(key) || 0,
        companies: companyCounts.get(key) || 0,
        connections: connectionCounts.get(key) || 0,
        revenue: revenueCounts.get(key) || 0,
      };
    });

    const recentActivities = [
      ...recentUsers.map((item) => ({
        icon: "users",
        title: `New user registered: ${item.name || "New account"}`,
        createdAt: item.createdAt,
      })),
      ...recentCompanies.map((item) => ({
        icon: "companies",
        title: `Company profile created: ${item.companyName}`,
        createdAt: item.createdAt,
      })),
      ...recentTransactions.map((item) => ({
        icon: "payments",
        title: `Payment received: ${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: item.currency,
          maximumFractionDigits: 0,
        }).format(item.amount)}`,
        createdAt: item.createdAt,
      })),
      ...recentMessages.map((item) => ({
        icon: "messages",
        title: "Message sent",
        createdAt: item.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map(({ createdAt, ...activity }) => ({
        ...activity,
        time: getActivityTime(createdAt, now),
      }));

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: now.toISOString(),
        overview: {
          totalUsers,
          totalCompanies,
          totalConnections,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        engagement: {
          posts: totalPosts,
          comments: totalComments,
          messages: totalMessages,
          saved: totalSavedPosts,
        },
        growth,
        comparisons: {
          users: { current: usersCurrentMonth, previous: usersPreviousMonth },
          companies: { current: companiesCurrentMonth, previous: companiesPreviousMonth },
          connections: { current: connectionsCurrentMonth, previous: connectionsPreviousMonth },
          revenue: {
            current: revenueCurrentMonth._sum.amount || 0,
            previous: revenuePreviousMonth._sum.amount || 0,
          },
        },
        recentActivities,
        health: {
          usersToday,
          companiesToday,
          messagesToday,
          totalInvestors,
          boostedProfiles,
          successfulPaymentsToday,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
