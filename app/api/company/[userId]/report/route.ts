import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam or fake business",
  HARASSMENT: "Harassment",
  HATE_SPEECH: "Hate Speech",
  NUDITY_OR_SEXUAL_CONTENT: "Inappropriate Content",
  VIOLENCE: "Violence",
  COPYRIGHT_VIOLATION: "Copyright Violation",
  OTHER: "Other",
};

const reportSchema = z.object({
  reason: z.enum(["SPAM", "NUDITY_OR_SEXUAL_CONTENT", "HATE_SPEECH", "HARASSMENT", "VIOLENCE", "COPYRIGHT_VIOLATION", "OTHER"]),
  details: z.string().max(500, "Details cannot exceed 500 characters").optional(),
  remark: z.string().max(500, "Remark cannot exceed 500 characters").optional(),
  pitchRequestId: z.string().optional(),
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
    const { reason, details, remark, pitchRequestId } = validation.data;
    const finalRemark = (remark || details || "").trim();

    if (companyUserId === user.id) {
      return NextResponse.json({ success: false, message: "You cannot report your own business" }, { status: 400 });
    }

    const company = await prisma.companyProfile.findUnique({
      where: { userId: companyUserId },
      select: { id: true, companyName: true },
    });
    if (!company) {
      return NextResponse.json({ success: false, message: "Business not found" }, { status: 404 });
    }

    const pitch = pitchRequestId
      ? await prisma.pitchRequest.findFirst({
          where: { id: pitchRequestId },
        })
      : await prisma.pitchRequest.findFirst({
          where: { senderId: companyUserId, investorId: user.id },
        });

    const existing = await prisma.companyReport.findUnique({
      where: { companyUserId_userId: { companyUserId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already reported this business" }, { status: 409 });
    }

    await prisma.companyReport.create({
      data: { companyUserId, userId: user.id, reason, details: finalRemark ? finalRemark : null },
    });

    const reasonLabel = REASON_LABELS[reason] || reason;
    const remarkLabel = finalRemark ? `"${finalRemark}"` : "None provided";
    const businessName = pitch?.companyName || company.companyName || "business";

    // 1. Notify the sender with reason and remark
    const senderContent = pitch
      ? `Your pitch request for "${businessName}" was reported. Reason: ${reasonLabel}. Remark: ${remarkLabel}`
      : `Your business profile was reported. Reason: ${reasonLabel}. Remark: ${remarkLabel}`;

    await prisma.notification.create({
      data: {
        userId: companyUserId,
        actorId: user.id,
        type: "SYSTEM",
        content: senderContent,
        link: `/profile/${companyUserId}`,
      },
    }).catch((err) => console.error("Failed to notify sender of report:", err));

    // 2. Notify all admins with reason and remark
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const adminContent = pitch
        ? `Pitch request from "${businessName}" was reported by ${user.name || "an investor"}. Reason: ${reasonLabel}. Remark: ${remarkLabel}`
        : `Business "${businessName}" was reported by ${user.name || "a user"}. Reason: ${reasonLabel}. Remark: ${remarkLabel}`;

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          actorId: user.id,
          type: "SYSTEM",
          content: adminContent,
          link: "/admin/notifications",
        })),
      }).catch((err) => console.error("Failed to notify admins of report:", err));
    }

    return NextResponse.json({ success: true, message: "Report submitted successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
