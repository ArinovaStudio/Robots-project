import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;
    const postStatusFilter = searchParams.get("postStatus"); 
    
    const whereClause: any = { reports: { some: {} }};

    if (postStatusFilter) {
      whereClause.status = postStatusFilter;
    }

    const [reportedPosts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause, skip,
        take: limit,
        orderBy: { reports: { _count: 'desc' } },
        include: {
          author: { select: { id: true, name: true, company: { select: { companyName: true } } } },
          media: true, 
          _count: { select: { reports: true } },
          reports: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: { reason: true, details: true, status: true, createdAt: true }
          }
        }
      }),
      prisma.post.count({ where: whereClause })
    ]);

    const formattedData = reportedPosts.map(post => ({
      postId: post.id,
      postStatus: post.status,
      content: post.content,
      media: post.media,
      author: post.author,
      totalReports: post._count.reports,
      recentReports: post.reports,
      createdAt: post.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}