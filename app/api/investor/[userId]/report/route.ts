import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam or fake profile",
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
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: investorUserId } = await params;
    if (investorUserId === user.id) {
      return NextResponse.json({ success: false, message: "You cannot report yourself" }, { status: 400 });
    }

    const validation = reportSchema.safeParse(await req.json());
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }
    const { reason, details } = validation.data;
    const remark = (details || "").trim();

    const investor = await prisma.user.findFirst({
      where: { id: investorUserId, accountType: "INVESTOR" },
      select: { id: true, name: true, investor: { select: { firmName: true } } },
    });
    if (!investor) {
      return NextResponse.json({ success: false, message: "Investor not found" }, { status: 404 });
    }

    const existing = await prisma.investorReport.findUnique({
      where: { investorUserId_reporterId: { investorUserId, reporterId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already reported this investor" }, { status: 409 });
    }

    await prisma.investorReport.create({
      data: { investorUserId, reporterId: user.id, reason, details: remark || null },
    });

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    if (admins.length > 0) {
      const investorName = investor.investor?.firmName || investor.name || "an investor";
      const content = `Investor "${investorName}" was reported by ${user.name || "a user"}. Reason: ${REASON_LABELS[reason] || reason}. Remark: ${remark ? `"${remark}"` : "None provided"}`;
      await prisma.notification
        .createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            actorId: user.id,
            type: "SYSTEM" as const,
            content,
            link: "/admin/notifications",
          })),
        })
        .catch((err) => console.error("Failed to notify admins of investor report:", err));
    }

    return NextResponse.json({ success: true, message: "Report submitted successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
