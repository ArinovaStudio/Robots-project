import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "BUSINESS") {
      return NextResponse.json({ success: false, message: "Only business accounts can view received offers." }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT o.id, o."pitchId", o.amount, o."amountValue", o.terms, o.message, o.status, o."createdAt",
             p.title AS "pitchTitle", p.sector AS "pitchSector", p.stage AS "pitchStage",
             p."targetAmount" AS "pitchTargetAmount",
             u.id AS "investorId", u.name, u.image, u."verificationStatus",
             ip."firmName", ip."investorType", ip."location"
      FROM "CompanyPitchOffer" o
      INNER JOIN "CompanyPitch" p ON o."pitchId" = p.id
      INNER JOIN "User" u ON o."investorId" = u.id
      LEFT JOIN "InvestorProfile" ip ON u.id = ip."userId"
      WHERE p."userId" = ${user.id}
      ORDER BY o."createdAt" DESC
      LIMIT 200
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("Failed to fetch received investor offers:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}