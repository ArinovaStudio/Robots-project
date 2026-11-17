import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InvestorInvestment" (
      "id" TEXT PRIMARY KEY,
      "investorId" TEXT NOT NULL,
      "companyId" TEXT,
      "companyName" TEXT NOT NULL,
      "amount" TEXT,
      "stage" TEXT DEFAULT 'Seed',
      "year" INTEGER,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "InvestorInvestment_investorId_idx" ON "InvestorInvestment"("investorId");
  `);
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const targetUserId = searchParams.get("userId") || user.id;

    try {
      const investments = await prisma.$queryRaw<any[]>`
        SELECT id, "companyName", "companyId", amount, stage, year, notes, "createdAt"
        FROM "InvestorInvestment"
        WHERE "investorId" = ${targetUserId}
        ORDER BY "createdAt" DESC
      `;
      return NextResponse.json({ success: true, data: investments });
    } catch (dbErr: any) {
      if (dbErr?.message?.includes("does not exist")) {
        await ensureTable();
        return NextResponse.json({ success: true, data: [] });
      }
      throw dbErr;
    }
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
    const parsedYear = year && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : new Date().getFullYear();

    const insertSql = `
      INSERT INTO "InvestorInvestment" ("id", "investorId", "companyId", "companyName", "amount", "stage", "year", "notes")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    try {
      await prisma.$executeRawUnsafe(
        insertSql,
        investmentId,
        user.id,
        companyId || null,
        companyName.trim(),
        amount ? String(amount).trim() : null,
        stage || "Seed",
        parsedYear,
        notes ? String(notes).trim() : null
      );
    } catch (insertError: any) {
      if (insertError?.message?.includes("does not exist")) {
        await ensureTable();
        await prisma.$executeRawUnsafe(
          insertSql,
          investmentId,
          user.id,
          companyId || null,
          companyName.trim(),
          amount ? String(amount).trim() : null,
          stage || "Seed",
          parsedYear,
          notes ? String(notes).trim() : null
        );
      } else {
        throw insertError;
      }
    }

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

export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType !== "INVESTOR") {
      return NextResponse.json({ success: false, message: "Only investors can manage investments." }, { status: 403 });
    }

    const body = await req.json();
    const { id, companyName, companyId, amount, stage, year, notes } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, message: "Investment ID is required." }, { status: 400 });
    }

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json({ success: false, message: "Company name is required." }, { status: 400 });
    }

    await ensureTable();

    const parsedYear = year && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : new Date().getFullYear();

    const updated = await prisma.$executeRawUnsafe(
      `UPDATE "InvestorInvestment"
       SET "companyName" = $1,
           "companyId" = $2,
           "amount" = $3,
           "stage" = $4,
           "year" = $5,
           "notes" = $6,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $7 AND "investorId" = $8`,
      companyName.trim(),
      companyId || null,
      amount ? String(amount).trim() : null,
      stage || "Seed",
      parsedYear,
      notes ? String(notes).trim() : null,
      id,
      user.id
    );

    if (updated === 0) {
      return NextResponse.json({ success: false, message: "Investment not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Investment updated successfully."
    });
  } catch (error) {
    console.error("Failed to update investment:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType !== "INVESTOR") {
      return NextResponse.json({ success: false, message: "Only investors can manage investments." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, message: "Investment ID is required." }, { status: 400 });
    }

    await ensureTable();

    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM "InvestorInvestment" WHERE "id" = $1 AND "investorId" = $2`,
      id,
      user.id
    );

    if (deleted === 0) {
      return NextResponse.json({ success: false, message: "Investment not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Investment deleted successfully."
    });
  } catch (error) {
    console.error("Failed to delete investment:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
