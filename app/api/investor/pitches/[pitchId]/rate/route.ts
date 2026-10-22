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
      return NextResponse.json({ success: false, message: "Only investors can rate pitches." }, { status: 403 });
    }

    const { pitchId } = await params;
    const body = await req.json();
    const { rating, feedback } = body;

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ success: false, message: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    const ratingId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CompanyPitchRating" ("id", "pitchId", "investorId", "rating", "feedback", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT ("pitchId", "investorId")
       DO UPDATE SET "rating" = EXCLUDED."rating", "feedback" = EXCLUDED."feedback", "createdAt" = NOW()`,
      ratingId,
      pitchId,
      user.id,
      numRating,
      feedback ? feedback.trim() : null
    );

    return NextResponse.json({
      success: true,
      message: `You rated this pitch ${numRating}/5 stars. Thank you!`
    });
  } catch (error) {
    console.error("Failed to rate pitch:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
