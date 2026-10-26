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

    const [companies, investors] = await Promise.all([
      prisma.companyProfile.findMany({
        where: {
          OR: [
            { companyName: { contains: query, mode: "insensitive" } },
            { type: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 3,
        select: {
          userId: true,
          companyName: true,
          logoUrl: true,
          type: true,
        }
      }),
      prisma.investorProfile.findMany({
        where: {
          OR: [
            { firmName: { contains: query, mode: "insensitive" } },
            { investorType: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } }
          ]
        },
        take: 3,
        select: {
          userId: true,
          firmName: true,
          investorType: true,
          user: { select: { name: true, image: true } }
        }
      })
    ]);

    const formattedCompanies = companies.map(c => ({
      id: c.userId,
      name: c.companyName,
      image: c.logoUrl,
      subtitle: c.type,
      type: "COMPANY",
      href: `/profile/${c.userId}`
    }));

    const formattedInvestors = investors.map(i => ({
      id: i.userId,
      name: i.user?.name || i.firmName || "Investor",
      image: i.user?.image || null,
      subtitle: i.firmName ? `${i.investorType} · ${i.firmName}` : i.investorType,
      type: "INVESTOR",
      href: `/profile/${i.userId}`
    }));

    return NextResponse.json({ success: true, data: [...formattedCompanies, ...formattedInvestors].slice(0, 5) });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
