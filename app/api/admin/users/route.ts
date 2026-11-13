import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const accountType = searchParams.get("accountType") || "";
    const verificationStatus = searchParams.get("verificationStatus") || "";
    const role = searchParams.get("role") || "";
    const sort = searchParams.get("sort") === "newest" ? "desc" : "asc";
    const skip = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { companyName: { contains: search, mode: "insensitive" } } },
          { investor: { firmName: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    if (status === "ACTIVE" || status === "SUSPENDED") {
      conditions.push({ status });
    }

    if (accountType === "BUSINESS" || accountType === "INVESTOR") {
      conditions.push({ accountType });
    }

    if (
      verificationStatus === "UNVERIFIED" ||
      verificationStatus === "PENDING" ||
      verificationStatus === "VERIFIED" ||
      verificationStatus === "REJECTED" ||
      verificationStatus === "MORE_INFO_REQUIRED"
    ) {
      conditions.push({ verificationStatus });
    }

    if (role === "USER" || role === "ADMIN") {
      conditions.push({ role });
    }

    const whereClause: any = conditions.length > 0 ? { AND: conditions } : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: sort },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountType: true,
          status: true,
          verificationStatus: true,
          isOnboarded: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              companyName: true,
              type: true,
              isBoosted: true,
              size: true,
            },
          },
          investor: {
            select: {
              id: true,
              firmName: true,
              investorType: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}