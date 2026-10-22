import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pitchId: string }> }
) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType !== "INVESTOR") {
      return NextResponse.json({ success: false, message: "Only investors are tracked for pitch views." }, { status: 200 });
    }

    const { pitchId } = await params;
    const viewId = crypto.randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "CompanyPitchView" ("id", "pitchId", "investorId", "createdAt")
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT ("pitchId", "investorId") DO NOTHING`,
      viewId,
      pitchId,
      user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record pitch view:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
