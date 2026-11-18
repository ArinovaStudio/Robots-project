import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** "Delete" from the investor directory: hides the investor from the viewer's list only. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: investorUserId } = await params;
    if (investorUserId === user.id) {
      return NextResponse.json({ success: false, message: "You can't remove yourself" }, { status: 400 });
    }

    const investor = await prisma.user.findFirst({
      where: { id: investorUserId, accountType: "INVESTOR" },
      select: { id: true },
    });
    if (!investor) {
      return NextResponse.json({ success: false, message: "Investor not found" }, { status: 404 });
    }

    await prisma.hiddenInvestor.upsert({
      where: { userId_investorUserId: { userId: user.id, investorUserId } },
      create: { userId: user.id, investorUserId },
      update: {},
    });

    return NextResponse.json({ success: true, message: "Investor removed from your list" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/** Undo "delete". */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: investorUserId } = await params;
    await prisma.hiddenInvestor.deleteMany({ where: { userId: user.id, investorUserId } });

    return NextResponse.json({ success: true, message: "Investor restored" });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
