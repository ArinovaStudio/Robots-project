import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const { user, error } = await getAdmin();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          message: error || "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const [
      totalUsers,
      totalCompanies,
      totalConnections,
      totalRevenue,

      totalPosts,
      totalComments,
      totalMessages,
      totalSavedPosts,

      boostedProfiles,
      activeSubscriptions,

      usersGrowth,
      companyGrowth,

      plans,

      recentUsers,
      recentCompanies,
      recentTransactions,
      recentMessages,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.companyProfile.count(),

      prisma.connection.count({
        where: {
          status: "ACCEPTED",
        },
      }),

      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.post.count(),

      prisma.comment.count(),

      prisma.directMessage.count(),

      prisma.savedPost.count(),

      prisma.companyProfile.count({
        where: {
          isBoosted: true,
        },
      }),

      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.user.groupBy({
        by: ["createdAt"],
        _count: true,
        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.companyProfile.groupBy({
        by: ["createdAt"],
        _count: true,
        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.plan.findMany({
        include: {
          _count: {
            select: {
              subscriptions: true,
              transactions: true,
            },
          },
        },
        orderBy: {
          price: "asc",
        },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
      }),

      prisma.companyProfile.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
      }),

      prisma.transaction.count({
        where: {
          status: "SUCCESS",
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
      }),

      prisma.directMessage.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: {
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

        growth: {
          users: usersGrowth,
          companies: companyGrowth,
        },

        plans,

        health: {
          dailyUsers: recentUsers,
          companiesToday: recentCompanies,
          messagesToday: recentMessages,
          newSubscriptions: activeSubscriptions,
          boostedProfiles,
          successfulPayments: recentTransactions,
        },
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
