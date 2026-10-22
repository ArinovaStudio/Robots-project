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
    const type = searchParams.get("type"); // "ALL", "PITCH", "PRODUCT", "IDEA"
    const sector = searchParams.get("sector");
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");

    let query = `
      SELECT p.id, p."userId", p.title, p.tagline, p.type, p.summary, p.sector, p.stage,
             p."targetAmount", p."equityOffered", p.highlights, p."pitchDeckUrl", p."websiteUrl",
             p.status, p."createdAt",
             cp."companyName", cp."logoUrl", cp."type" as "companyType", cp.location, cp.size,
             u.name as "founderName", u.image as "founderImage", u."verificationStatus"
      FROM "CompanyPitch" p
      INNER JOIN "User" u ON p."userId" = u.id
      LEFT JOIN "CompanyProfile" cp ON p."userId" = cp."userId"
      WHERE p.status = 'ACTIVE'
    `;

    const params: any[] = [];
    if (type && type !== "ALL") {
      params.push(type);
      query += ` AND p.type = $${params.length}`;
    }
    if (sector && sector !== "ALL") {
      params.push(sector);
      query += ` AND p.sector ILIKE $${params.length}`;
    }
    if (stage && stage !== "ALL") {
      params.push(stage);
      query += ` AND p.stage ILIKE $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.summary ILIKE $${params.length} OR cp."companyName" ILIKE $${params.length})`;
    }

    query += ` ORDER BY p."createdAt" DESC LIMIT 50`;

    const pitches = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    // Fetch user connections to check relationship
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      select: {
        senderId: true,
        receiverId: true,
        status: true
      }
    });

    const connectionMap = new Map<string, string>();
    userConnections.forEach(c => {
      const otherId = c.senderId === user.id ? c.receiverId : c.senderId;
      connectionMap.set(otherId, c.status);
    });

    const formattedPitches = pitches.map(p => ({
      id: p.id,
      userId: p.userId,
      title: p.title,
      tagline: p.tagline,
      type: p.type,
      summary: p.summary,
      sector: p.sector,
      stage: p.stage,
      targetAmount: p.targetAmount,
      equityOffered: p.equityOffered,
      highlights: Array.isArray(p.highlights) ? p.highlights : [],
      pitchDeckUrl: p.pitchDeckUrl,
      websiteUrl: p.websiteUrl,
      createdAt: p.createdAt,
      company: {
        companyName: p.companyName || p.founderName || "Innovator Company",
        logoUrl: p.logoUrl || p.founderImage,
        type: p.companyType || p.sector,
        location: p.location,
        size: p.size,
        founderName: p.founderName,
        isVerified: p.verificationStatus === "VERIFIED"
      },
      connectionStatus: connectionMap.get(p.userId) || null
    }));

    return NextResponse.json({
      success: true,
      data: formattedPitches
    });

  } catch (error) {
    console.error("Failed to fetch pitches:", error);
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

    if (!title || !summary || !sector) {
      return NextResponse.json({
        success: false,
        message: "Title, summary, and sector are required."
      }, { status: 400 });
    }

    const pitchId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CompanyPitch" (
        "id", "userId", "title", "tagline", "type", "summary", "sector", "stage",
        "targetAmount", "equityOffered", "highlights", "pitchDeckUrl", "websiteUrl", "status"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ACTIVE')`,
      pitchId,
      user.id,
      title.trim(),
      tagline ? tagline.trim() : null,
      type,
      summary.trim(),
      sector.trim(),
      stage,
      targetAmount || null,
      equityOffered || null,
      Array.isArray(highlights) ? highlights : [],
      pitchDeckUrl || null,
      websiteUrl || null
    );

    return NextResponse.json({
      success: true,
      message: "Pitch published successfully to the investor portal.",
      data: { id: pitchId }
    });

  } catch (error) {
    console.error("Failed to create pitch:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
