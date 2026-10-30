import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/uploads";
import crypto from "crypto";
import { formatTargetAmount } from "@/lib/utils";

type CompanyPitchRow = Record<string, unknown> & {
  id: string;
  targetAmount: string | null;
  highlights: unknown;
};

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    // Fetch all pitches created by this company
    const pitches = await prisma.$queryRaw<CompanyPitchRow[]>`
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
          prisma.$queryRaw<Record<string, unknown>[]>`
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
          prisma.$queryRaw<Record<string, unknown>[]>`
            SELECT o.id, o."amount", o."amountValue", o.terms, o.message, o.status, o."createdAt",
                   u.id as "investorId", u.name, u.image,
                   ip."firmName", ip."investorType"
            FROM "CompanyPitchOffer" o
            INNER JOIN "User" u ON o."investorId" = u.id
            LEFT JOIN "InvestorProfile" ip ON u.id = ip."userId"
            WHERE o."pitchId" = ${pitch.id}
            ORDER BY o."createdAt" DESC
          `,
          prisma.$queryRaw<Record<string, unknown>[]>`
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

    let body: Record<string, unknown>;
    let pitchDeckFile: File | null = null;
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const getValue = (key: string) => formData.get(key)?.toString() ?? "";
      const file = formData.get("pitchDeck");
      pitchDeckFile = file && typeof file !== "string" ? file : null;
      body = {
        title: getValue("title"),
        tagline: getValue("tagline"),
        type: getValue("type") || "PITCH",
        summary: getValue("summary"),
        sector: getValue("sector"),
        stage: getValue("stage") || "Seed",
        targetAmount: getValue("targetAmount"),
        equityOffered: getValue("equityOffered"),
        highlights: getValue("highlights") || "[]",
        pitchDeckUrl: getValue("pitchDeckUrl"),
        websiteUrl: getValue("websiteUrl"),
      };
    } else {
      const parsedBody: unknown = await req.json();
      if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
        return NextResponse.json({ success: false, message: "Invalid pitch data." }, { status: 400 });
      }
      body = parsedBody as Record<string, unknown>;
    }

    const title = typeof body.title === "string" ? body.title : "";
    const tagline = typeof body.tagline === "string" ? body.tagline : "";
    const type = typeof body.type === "string" ? body.type : "PITCH";
    const summary = typeof body.summary === "string" ? body.summary : "";
    const sector = typeof body.sector === "string" ? body.sector : "";
    const stage = typeof body.stage === "string" ? body.stage : "Seed";
    const targetAmount = typeof body.targetAmount === "string" ? body.targetAmount : "";
    const equityOffered = typeof body.equityOffered === "string" ? body.equityOffered : "";
    const pitchDeckUrl = typeof body.pitchDeckUrl === "string" ? body.pitchDeckUrl : "";
    const websiteUrl = typeof body.websiteUrl === "string" ? body.websiteUrl : "";
    let highlights: unknown = body.highlights ?? [];

    if (typeof highlights === "string") {
      try {
        highlights = JSON.parse(highlights);
      } catch {
        return NextResponse.json({ success: false, message: "Invalid highlights format." }, { status: 400 });
      }
    }

    if (!title?.trim() || !summary?.trim() || !sector?.trim()) {
      return NextResponse.json({
        success: false,
        message: "Title, summary, and sector are required."
      }, { status: 400 });
    }

    let uploadedPitchDeckUrl: string | null = null;
    if (pitchDeckFile) {
      if (pitchDeckFile.type !== "application/pdf") {
        return NextResponse.json({ success: false, message: "Pitch deck must be a PDF file." }, { status: 400 });
      }
      if (pitchDeckFile.size === 0 || pitchDeckFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "PDF files must be non-empty and 10 MB or smaller." }, { status: 400 });
      }

      const signature = new Uint8Array(await pitchDeckFile.slice(0, 5).arrayBuffer());
      if (new TextDecoder().decode(signature) !== "%PDF-") {
        return NextResponse.json({ success: false, message: "The selected file is not a valid PDF." }, { status: 400 });
      }

      uploadedPitchDeckUrl = await uploadFile(pitchDeckFile, "pitches/decks");
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
      uploadedPitchDeckUrl || (pitchDeckUrl ? pitchDeckUrl.trim() : null),
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
