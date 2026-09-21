import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const companies = await prisma.companyProfile.findMany({
      where: {
        OR: [
          { companyName: { contains: query, mode: "insensitive" } },
          { type: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 4,
      select: {
        userId: true,
        companyName: true,
        logoUrl: true,
        type: true,
      }
    });

    const formatted = companies.map(c => ({
      id: c.userId,
      name: c.companyName,
      image: c.logoUrl,
      subtitle: c.type,
      type: "COMPANY",
      href: `/profile/${c.userId}`
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
