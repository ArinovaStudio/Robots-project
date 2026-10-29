import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { formatTargetAmount } from "@/lib/utils";

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    // Fetch all pitches created by this company
    const pitches = await prisma.$queryRaw<any[]>`
      SELECT p.id, p."userId", p.title, p.tagline, p.type, p.summary, p.sector, p.stage,
             p."targetAmount", p."equityOffered", p.highlights, p."pitchDeckUrl", p."websiteUrl",
             p.status, p."isSharedWithCompanies", p."feedPostId", p."collabRequestId", p."createdAt",
             (SELECT count(*)::int FROM "CompanyPitchView" v WHERE v."pitchId" = p.id) as "viewCount",
             (SELECT count(*)::int FROM "CompanyPitchOffer" o WHERE o."pitchId" = p.id) as "offerCount",
             (SELECT COALESCE(sum(o."amountValue"), 0)::float FROM "CompanyPitchOffer" o WHERE o."pitchId" = p.id) as "totalOfferAmount",
             (SELECT count(*)::int FROM "CompanyPitchRating" r WHERE r."pitchId" = p.id) as "ratingCount",
             (SELECT COALESCE(avg(r.rating), 0)::float FROM "CompanyPitchRating" r WHERE r."pitchId" = p.id) as "averageRating"
      FROM "CompanyPitch" p
      WHERE p."userId" = ${user.id}
      ORDER BY p."createdAt" DESC
    `;

    // Fetch detailed investor views, offers, and ratings for each pitch
    const detailedPitches = await Promise.all(
      pitches.map(async (pitch) => {
        const [views, offers, ratings] = await Promise.all([
          prisma.$queryRaw<any[]>`
            SELECT v."createdAt" as "viewedAt",
                   u.id as "investorId", u.name, u.image,
                   ip."firmName", ip."investorType", ip."location"
            FROM "CompanyPitchView" v
            INNER JOIN "User" u ON v."investorId" = u.id
            LEFT JOIN "InvestorProfile" ip ON u.id = ip."userId"
            WHERE v."pitchId" = ${pitch.id}
            ORDER BY v."createdAt" DESC
            LIMIT 20
          `,
          prisma.$queryRaw<any[]>`
            SELECT o.id, o."amount", o."amountValue", o.terms, o.message, o.status, o."createdAt",
                   u.id as "investorId", u.name, u.image,
                   ip."firmName", ip."investorType"
            FROM "CompanyPitchOffer" o
            INNER JOIN "User" u ON o."investorId" = u.id
            LEFT JOIN "InvestorProfile" ip ON u.id = ip."userId"
            WHERE o."pitchId" = ${pitch.id}
            ORDER BY o."createdAt" DESC
          `,
          prisma.$queryRaw<any[]>`
            SELECT r.id, r.rating, r.feedback, r."createdAt",
                   u.name as "investorName", u.image as "investorImage",
                   ip."firmName", ip."investorType"
            FROM "CompanyPitchRating" r
            INNER JOIN "User" u ON r."investorId" = u.id
            LEFT JOIN "InvestorProfile" ip ON u.id = ip."userId"
            WHERE r."pitchId" = ${pitch.id}
            ORDER BY r."createdAt" DESC
          `
        ]);

        return {
          ...pitch,
          targetAmount: pitch.targetAmount ? formatTargetAmount(pitch.targetAmount) : null,
          highlights: Array.isArray(pitch.highlights) ? pitch.highlights : [],
          views,
          offers,
          ratings
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: detailedPitches
    });

  } catch (error) {
    console.error("Failed to fetch company pitches:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      tagline,
      type = "PITCH",
      summary,
      sector,
      stage = "Seed",
      targetAmount,
      equityOffered,
      highlights = [],
      pitchDeckUrl,
      websiteUrl
    } = body;

    if (!title?.trim() || !summary?.trim() || !sector?.trim()) {
      return NextResponse.json({
        success: false,
        message: "Title, summary, and sector are required."
      }, { status: 400 });
    }

    const pitchId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CompanyPitch" (
        "id", "userId", "title", "tagline", "type", "summary", "sector", "stage",
        "targetAmount", "equityOffered", "highlights", "pitchDeckUrl", "websiteUrl", "status", "isSharedWithCompanies"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ACTIVE', false)`,
      pitchId,
      user.id,
      title.trim(),
      tagline ? tagline.trim() : null,
      type,
      summary.trim(),
      sector.trim(),
      stage,
      targetAmount ? formatTargetAmount(targetAmount) : null,
      equityOffered ? equityOffered.trim() : null,
      Array.isArray(highlights) ? highlights : [],
      pitchDeckUrl ? pitchDeckUrl.trim() : null,
      websiteUrl ? websiteUrl.trim() : null
    );

    return NextResponse.json({
      success: true,
      message: "Pitch created successfully.",
      data: { id: pitchId }
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to create pitch:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
