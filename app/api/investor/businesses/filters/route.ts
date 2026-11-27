import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Industry options for the Business Collaboration filter. Industry is free text on
// the company profile, so the list is read from what businesses actually use.
// (Sectors come from the fixed list in lib/pitch-sectors.ts.)

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.companyProfile.findMany({
      where: { user: { status: "ACTIVE", accountType: "BUSINESS" } },
      distinct: ["type"],
      select: { type: true },
      take: 200,
    });

    const seen = new Map<string, string>();
    rows.forEach(({ type }) => {
      const v = type.trim();
      if (v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
    });

    return NextResponse.json({
      success: true,
      data: { industries: [...seen.values()].sort((a, b) => a.localeCompare(b)) },
    });
  } catch (error) {
    console.error("Failed to fetch business filter options:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
