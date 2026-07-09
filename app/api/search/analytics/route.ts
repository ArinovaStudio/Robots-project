import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, startOfYear } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "monthly";
    const limit = searchParams.get("limit") || "10";

    let dateFilter = {};
    const now = new Date();
    
    if (filter === "monthly") {
      dateFilter = { gte: startOfMonth(now) };
    } else if (filter === "yearly") {
      dateFilter = { gte: startOfYear(now) };
    }

    const topSearchesData = await prisma.searchStat.groupBy({
      by: ['query'],
      where: { isTag: false, ...(filter !== "total" && { date: dateFilter }) },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: Number(limit)
    });

    const topTagsData = await prisma.searchStat.groupBy({
      by: ['query'],
      where: { isTag: true, ...(filter !== "total" && { date: dateFilter }) },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: Number(limit)
    });

    const topSearches = topSearchesData.map(item => ({
      title: item.query,
      count: item._sum.count || 0
    }));

    const topTags = topTagsData.map(item => ({
      tag: item.query,
      count: item._sum.count || 0
    }));

    return NextResponse.json({ success: true, data: { topSearches, topTags } }, { status: 200 });

  } catch {
    return NextResponse.json( { success: false, message: "Internal Server Error" }, { status: 500 } );
  }
}