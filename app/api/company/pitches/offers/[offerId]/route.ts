import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await params;
    const body = await req.json();
    const { action } = body; // "ACCEPTED" | "DECLINED"

    if (action !== "ACCEPTED" && action !== "DECLINED") {
      return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
    }

    const offers = await prisma.$queryRaw<any[]>`
      SELECT o.id, o."pitchId", o."investorId", o.amount, p."userId" as "companyUserId", p.title as "pitchTitle"
      FROM "CompanyPitchOffer" o
      INNER JOIN "CompanyPitch" p ON o."pitchId" = p.id
      WHERE o.id = ${offerId}
      LIMIT 1
    `;

    if (!offers || offers.length === 0) {
      return NextResponse.json({ success: false, message: "Offer not found." }, { status: 404 });
    }

    const offer = offers[0];
    if (offer.companyUserId !== user.id) {
      return NextResponse.json({ success: false, message: "You do not own this pitch." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE "CompanyPitchOffer" SET "status" = $1, "updatedAt" = NOW() WHERE id = $2`,
        action,
        offerId
      );

      // Notify the investor
      await tx.notification.create({
        data: {
          userId: offer.investorId,
          actorId: user.id,
          type: "SYSTEM",
          content: `${user.name || "The company"} has ${action === "ACCEPTED" ? "accepted" : "declined"} your offer of ${offer.amount} for "${offer.pitchTitle}"`,
          link: `/investors/portal`
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Offer marked as ${action.toLowerCase()}.`
    });

  } catch (error) {
    console.error("Failed to update offer:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
