import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reportSchema = z.object({
  reason: z.enum(["SPAM", "NUDITY_OR_SEXUAL_CONTENT", "HATE_SPEECH", "HARASSMENT", "VIOLENCE", "COPYRIGHT_VIOLATION", "OTHER"]),
  details: z.string().max(500, "Details cannot exceed 500 characters").optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: companyUserId } = await params;

    const validation = reportSchema.safeParse(await req.json());
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }
    const { reason, details } = validation.data;

    if (companyUserId === user.id) {
      return NextResponse.json({ success: false, message: "You cannot report your own business" }, { status: 400 });
    }

    const company = await prisma.companyProfile.findUnique({ where: { userId: companyUserId }, select: { id: true } });
    if (!company) {
      return NextResponse.json({ success: false, message: "Business not found" }, { status: 404 });
    }

    const existing = await prisma.companyReport.findUnique({
      where: { companyUserId_userId: { companyUserId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already reported this business" }, { status: 409 });
    }

    await prisma.companyReport.create({
      data: { companyUserId, userId: user.id, reason, details: details?.trim() ? details.trim() : null },
    });

    return NextResponse.json({ success: true, message: "Report submitted successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
