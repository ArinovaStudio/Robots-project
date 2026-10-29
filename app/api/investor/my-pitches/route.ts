import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTargetAmount } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    // 1. Pitches created by this user
    let createdPitches: any[] = [];
    try {
      createdPitches = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.id, p."userId", p.title, p.tagline, p.type, p.summary, p.sector, p.stage,
                p."targetAmount", p."equityOffered", p.highlights, p."pitchDeckUrl", p."websiteUrl",
                p.status, p."createdAt",
                (SELECT count(*)::int FROM "CompanyPitchView" v WHERE v."pitchId" = p.id) as "viewCount",
                (SELECT count(*)::int FROM "CompanyPitchOffer" o WHERE o."pitchId" = p.id) as "offerCount",
                (SELECT COALESCE(sum(o."amountValue"), 0)::float FROM "CompanyPitchOffer" o WHERE o."pitchId" = p.id) as "totalOfferAmount",
                (SELECT count(*)::int FROM "CompanyPitchRating" r WHERE r."pitchId" = p.id) as "ratingCount",
                (SELECT COALESCE(avg(r.rating), 0)::float FROM "CompanyPitchRating" r WHERE r."pitchId" = p.id) as "averageRating"
         FROM "CompanyPitch" p
         WHERE p."userId" = $1
         ORDER BY p."createdAt" DESC`,
        user.id
      );
    } catch (err) {
      console.warn("Could not query created pitches:", err);
    }

    // 2. Investment offers submitted by this investor
    let offers: any[] = [];
    try {
      offers = await prisma.$queryRawUnsafe<any[]>(
        `SELECT o.id, o."pitchId", o."amount", o."amountValue", o.terms, o.message, o.status, o."createdAt",
                p.title as "pitchTitle", p.sector, p.stage, p.type as "pitchType",
                cp."companyName", cp."logoUrl", cp.location,
                u.name as "founderName", u.id as "founderId"
         FROM "CompanyPitchOffer" o
         INNER JOIN "CompanyPitch" p ON o."pitchId" = p.id
         INNER JOIN "User" u ON p."userId" = u.id
         LEFT JOIN "CompanyProfile" cp ON p."userId" = cp."userId"
         WHERE o."investorId" = $1
         ORDER BY o."createdAt" DESC`,
        user.id
      );
    } catch (err) {
      console.warn("Could not query offers:", err);
    }

    // 3. Ratings submitted by this investor
    let ratings: any[] = [];
    try {
      ratings = await prisma.$queryRawUnsafe<any[]>(
        `SELECT r.id, r."pitchId", r.rating, r.feedback, r."createdAt",
                p.title as "pitchTitle", p.sector, p.stage, p.type as "pitchType",
                cp."companyName", cp."logoUrl",
                u.name as "founderName", u.id as "founderId"
         FROM "CompanyPitchRating" r
         INNER JOIN "CompanyPitch" p ON r."pitchId" = p.id
         INNER JOIN "User" u ON p."userId" = u.id
         LEFT JOIN "CompanyProfile" cp ON p."userId" = cp."userId"
         WHERE r."investorId" = $1
         ORDER BY r."createdAt" DESC`,
        user.id
      );
    } catch (err) {
      console.warn("Could not query ratings:", err);
    }

    const formattedCreatedPitches = createdPitches.map((p) => ({
      ...p,
      targetAmount: p.targetAmount ? formatTargetAmount(p.targetAmount) : null,
      highlights: Array.isArray(p.highlights) ? p.highlights : [],
      viewCount: Number(p.viewCount || 0),
      offerCount: Number(p.offerCount || 0),
      totalOfferAmount: Number(p.totalOfferAmount || 0),
      ratingCount: Number(p.ratingCount || 0),
      averageRating: Number(p.averageRating || 0),
    }));

    const formattedOffers = offers.map((o) => ({
      ...o,
      amount: formatTargetAmount(o.amount),
      companyName: o.companyName || o.founderName || "Innovator Company",
    }));

    const formattedRatings = ratings.map((r) => ({
      ...r,
      companyName: r.companyName || r.founderName || "Innovator Company",
    }));

    const totalOfferedAmount = formattedOffers.reduce(
      (sum, o) => sum + (Number(o.amountValue) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        createdPitches: formattedCreatedPitches,
        offers: formattedOffers,
        ratings: formattedRatings,
        stats: {
          createdCount: formattedCreatedPitches.length,
          offersCount: formattedOffers.length,
          totalOfferedAmount,
          ratingsCount: formattedRatings.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load investor pitches data:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
