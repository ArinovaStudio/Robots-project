import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 403 },
      );
    }

    const [pendingVerifications, pendingReports] = await Promise.all([
      prisma.verificationApplication.count({ where: { status: "PENDING" } }),
      prisma.postReport.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { pendingVerifications, pendingReports },
    });
  } catch (error) {
    console.error("Failed to load admin notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
