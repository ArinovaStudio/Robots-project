import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: companyUserId } = await params;
    if (companyUserId === user.id) {
      return NextResponse.json({ success: false, message: "You can't hide your own business" }, { status: 400 });
    }

    const company = await prisma.companyProfile.findUnique({ where: { userId: companyUserId }, select: { id: true } });
    if (!company) {
      return NextResponse.json({ success: false, message: "Business not found" }, { status: 404 });
    }

    await prisma.hiddenCompany.upsert({
      where: { userId_companyUserId: { userId: user.id, companyUserId } },
      create: { userId: user.id, companyUserId },
      update: {},
    });

    return NextResponse.json({ success: true, message: "Business hidden" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/** Undo "hide business". */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: companyUserId } = await params;
    await prisma.hiddenCompany.deleteMany({ where: { userId: user.id, companyUserId } });

    return NextResponse.json({ success: true, message: "Business restored" });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
