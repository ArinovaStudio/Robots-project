import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user: admin, error } = await getAdmin();
    if (error || !admin) {
      return NextResponse.json({ success: false, message: error || "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status") || "ALL";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Calculate Summary Stats
    const [total, pending, approved, rejected, infoRequired] = await Promise.all([
      prisma.verificationApplication.count(),
      prisma.verificationApplication.count({ where: { status: "PENDING" } }),
      prisma.verificationApplication.count({ where: { status: "VERIFIED" } }),
      prisma.verificationApplication.count({ where: { status: "REJECTED" } }),
      prisma.verificationApplication.count({ where: { status: "MORE_INFO_REQUIRED" } }),
    ]);

    const stats = {
      total,
      pending,
      approved,
      rejected,
      infoRequired,
    };

    // Where clause construction
    const where: any = {};

    if (statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sorting order
    let orderBy: any = { createdAt: "desc" };
    if (sort === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sort === "updated") {
      orderBy = { updatedAt: "desc" };
    }

    const [applications, filteredCount] = await Promise.all([
      prisma.verificationApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
              verificationStatus: true,
              company: {
                select: {
                  companyName: true,
                  logoUrl: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
      prisma.verificationApplication.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      stats,
      pagination: {
        total: filteredCount,
        page,
        limit,
        totalPages: Math.ceil(filteredCount / limit),
      },
    });
  } catch (err: any) {
    console.error("Error fetching admin verification requests:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
