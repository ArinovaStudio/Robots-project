import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [savedPostsData, totalCount] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId: user.id, post: { status: "ACTIVE" } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: { media: true,
              author: {
                select: { id: true, name: true, company: { select: { companyName: true, logoUrl: true, isBoosted: true } } }
              },
              _count: {
                select: { comments: true, reactions: true }
              }
            }
          }
        }
      }),
      prisma.savedPost.count({ where: { userId: user.id } })
    ]);

    const formattedPosts = savedPostsData.map(savedRecord => ({
      savedAt: savedRecord.createdAt,
      ...savedRecord.post
    }));

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}