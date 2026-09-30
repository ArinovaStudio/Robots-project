import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: admin, error } = await getAdmin();
    if (error || !admin) {
      return NextResponse.json({ success: false, message: error || "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason, infoRequestMessage } = body;

    if (!action || !["APPROVE", "REJECT", "REQUEST_MORE_INFO"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid admin action specified." }, { status: 400 });
    }

    const application = await prisma.verificationApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "Verification application not found." }, { status: 404 });
    }

    const previousStatus = application.status;
    let newStatus: "VERIFIED" | "REJECTED" | "MORE_INFO_REQUIRED" = "VERIFIED";
    let historyActionText = "";
    let historyMessage: string | null = null;

    if (action === "APPROVE") {
      newStatus = "VERIFIED";
      historyActionText = "Approved Verification Application";
      historyMessage = "Application was reviewed and approved by administrator.";

      await prisma.$transaction([
        prisma.verificationApplication.update({
          where: { id },
          data: {
            status: "VERIFIED",
            reviewedBy: admin.name || admin.email || "Admin",
            reviewedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: application.userId },
          data: {
            verificationStatus: "VERIFIED",
          },
        }),
        prisma.verificationHistory.create({
          data: {
            applicationId: id,
            action: historyActionText,
            previousStatus,
            newStatus: "VERIFIED",
            message: historyMessage,
            performedBy: admin.name || admin.email || "Admin",
          },
        }),
      ]);
    } else if (action === "REJECT") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ success: false, message: "Rejection reason is required." }, { status: 400 });
      }

      newStatus = "REJECTED";
      historyActionText = "Rejected Verification Application";
      historyMessage = rejectionReason.trim();

      await prisma.$transaction([
        prisma.verificationApplication.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason.trim(),
            reviewedBy: admin.name || admin.email || "Admin",
            reviewedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: application.userId },
          data: {
            verificationStatus: "REJECTED",
          },
        }),
        prisma.verificationHistory.create({
          data: {
            applicationId: id,
            action: historyActionText,
            previousStatus,
            newStatus: "REJECTED",
            message: historyMessage,
            performedBy: admin.name || admin.email || "Admin",
          },
        }),
      ]);
    } else if (action === "REQUEST_MORE_INFO") {
      if (!infoRequestMessage || !infoRequestMessage.trim()) {
        return NextResponse.json({ success: false, message: "Message detailing required information is required." }, { status: 400 });
      }

      newStatus = "MORE_INFO_REQUIRED";
      historyActionText = "Requested More Information";
      historyMessage = infoRequestMessage.trim();

      await prisma.$transaction([
        prisma.verificationApplication.update({
          where: { id },
          data: {
            status: "MORE_INFO_REQUIRED",
            infoRequestMessage: infoRequestMessage.trim(),
            reviewedBy: admin.name || admin.email || "Admin",
            reviewedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: application.userId },
          data: {
            verificationStatus: "MORE_INFO_REQUIRED",
          },
        }),
        prisma.verificationHistory.create({
          data: {
            applicationId: id,
            action: historyActionText,
            previousStatus,
            newStatus: "MORE_INFO_REQUIRED",
            message: historyMessage,
            performedBy: admin.name || admin.email || "Admin",
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: `Application successfully updated to ${newStatus}`,
    });
  } catch (err: any) {
    console.error("Error performing admin action on verification application:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
