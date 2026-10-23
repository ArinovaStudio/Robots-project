import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const targetUserId = searchParams.get("userId") || user.id;

    const investments = await prisma.$queryRaw<any[]>`
      SELECT id, "companyName", "companyId", amount, stage, year, notes, "createdAt"
      FROM "InvestorInvestment"
      WHERE "investorId" = ${targetUserId}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({ success: true, data: investments });
  } catch (error) {
    console.error("Failed to fetch investments:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType !== "INVESTOR") {
      return NextResponse.json({ success: false, message: "Only investors can record investments." }, { status: 403 });
    }

    const body = await req.json();
    const { companyName, companyId, amount, stage, year, notes } = body;

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json({ success: false, message: "Company name is required." }, { status: 400 });
    }

    const investmentId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "InvestorInvestment" ("id", "investorId", "companyId", "companyName", "amount", "stage", "year", "notes")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      investmentId,
      user.id,
      companyId || null,
      companyName.trim(),
      amount || null,
      stage || "Seed",
      year && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : new Date().getFullYear(),
      notes || null
    );

    return NextResponse.json({
      success: true,
      message: "Investment recorded successfully.",
      data: { id: investmentId }
    });
  } catch (error) {
    console.error("Failed to record investment:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
