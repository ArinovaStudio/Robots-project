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
      return NextResponse.json({ success: false, message: "Only investors can submit investment offers." }, { status: 403 });
    }

    const { pitchId } = await params;
    const body = await req.json();
    const { amount, terms, message } = body;

    if (!amount || typeof amount !== "string" || !amount.trim()) {
      return NextResponse.json({ success: false, message: "Offer amount is required." }, { status: 400 });
    }

    // Extract numeric amount for aggregation (e.g. "$100,000" -> 100000, "50k" -> 50000)
    let cleanVal = amount.replace(/[^0-9.kmKM]/g, "");
    let numericAmount = 0;
    if (cleanVal.toLowerCase().endsWith("m")) {
      numericAmount = parseFloat(cleanVal) * 1000000;
    } else if (cleanVal.toLowerCase().endsWith("k")) {
      numericAmount = parseFloat(cleanVal) * 1000;
    } else {
      numericAmount = parseFloat(cleanVal) || 0;
    }

    if (numericAmount <= 0) {
      return NextResponse.json({ success: false, message: "Offer amount must be a positive number." }, { status: 400 });
    }

    // Find company owner of the pitch
    const pitches = await prisma.$queryRaw<any[]>`
      SELECT "userId", title FROM "CompanyPitch" WHERE id = ${pitchId} LIMIT 1
    `;
    if (!pitches || pitches.length === 0) {
      return NextResponse.json({ success: false, message: "Pitch not found." }, { status: 404 });
    }

    const pitchOwnerId = pitches[0].userId;
    if (pitchOwnerId === user.id) {
      return NextResponse.json({ success: false, message: "You cannot make an offer on your own pitch." }, { status: 400 });
    }
    const offerId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "CompanyPitchOffer" ("id", "pitchId", "investorId", "amount", "amountValue", "terms", "message", "status")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
        offerId,
        pitchId,
        user.id,
        amount.trim(),
        numericAmount,
        terms ? terms.trim() : "Equity / SAFE",
        message ? message.trim() : null
      );

      // Create notification for company owner
      await tx.notification.create({
        data: {
          userId: pitchOwnerId,
          actorId: user.id,
          type: "SYSTEM",
          content: `${user.name || "An investor"} made an investment offer of ${amount.trim()} for your pitch: "${pitches[0].title}"`,
          link: "/company/pitches"
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Investment offer submitted successfully!",
      data: { offerId }
    });

  } catch (error) {
    console.error("Failed to submit offer:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
