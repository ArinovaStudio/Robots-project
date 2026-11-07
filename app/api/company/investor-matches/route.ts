import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "BUSINESS") {
      return NextResponse.json({ success: false, message: "Business account required" }, { status: 403 });
    }

    const typeParam = req.nextUrl.searchParams.get("type");
    if (typeParam !== "suggested" && typeParam !== "similar") {
      return NextResponse.json({ success: false, message: "Invalid recommendation type" }, { status: 400 });
    }
    const investorProfiles = await prisma.investorProfile.findMany({
      where: { user: { accountType: "INVESTOR" } },
      select: {
        userId: true,
        investorType: true,
        firmName: true,
        sectors: true,
        stages: true,
        investmentRange: true,
        location: true,
        city: true,
        country: true,
        previousInvestmentCount: true,
        investmentThesis: true,
        user: {
          select: {
            name: true,
            image: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const matches = investorProfiles.map((investor) => ({
        id: investor.userId,
        name: investor.user.name || investor.firmName || "Investor",
        image: investor.user.image,
        verificationStatus: investor.user.verificationStatus,
        firmName: investor.firmName,
        investorType: investor.investorType,
        sectors: investor.sectors,
        stages: investor.stages,
        investmentRange: investor.investmentRange,
        location: investor.city
          ? `${investor.city}${investor.country ? `, ${investor.country}` : ""}`
          : investor.location,
        investmentThesis: investor.investmentThesis,
        previousInvestmentCount: investor.previousInvestmentCount,
      }));

    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    console.error("Failed to fetch business investor matches:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
