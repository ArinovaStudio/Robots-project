import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/uploads";
import { formatTargetAmount } from "@/lib/utils";

const MAX_PDF_BYTES = 120 * 1024 * 1024;

const LIMITS = {
  companyName: 120,
  problemStatement: 2000,
  proposedSolution: 2000,
  fundingRequirement: 60,
  equityOffered: 30,
  message: 2000,
} as const;

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType !== "BUSINESS") {
      return NextResponse.json(
        { success: false, message: "Only business accounts can send pitch requests." },
        { status: 403 }
      );
    }

    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }

    const formData = await req.formData();
    const get = (key: string) => formData.get(key)?.toString().trim() ?? "";

    const investorId = get("investorId");
    const companyName = get("companyName");
    const problemStatement = get("problemStatement");
    const proposedSolution = get("proposedSolution");
    const fundingRequirement = get("fundingRequirement");
    const equityOffered = get("equityOffered"); // optional
    const message = get("message");
    const deck = formData.get("pitchDeck");
    const pitchDeckFile = deck && typeof deck !== "string" ? deck : null;

    // ── Required fields ───────────────────────────────────────────────
    const missing: string[] = [];
    if (!investorId) missing.push("investor");
    if (!companyName) missing.push("startup/company name");
    if (!problemStatement) missing.push("problem statement");
    if (!proposedSolution) missing.push("proposed solution");
    if (!fundingRequirement) missing.push("funding requirement");
    if (!message) missing.push("message to investor");
    if (!pitchDeckFile) missing.push("pitch deck (PDF)");
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Please provide: ${missing.join(", ")}.` },
        { status: 400 }
      );
    }
    const tooLong = (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).find((key) => {
      const value = { companyName, problemStatement, proposedSolution, fundingRequirement, equityOffered, message }[key];
      return value.length > LIMITS[key];
    });
    if (tooLong) {
      return NextResponse.json(
        { success: false, message: `"${tooLong}" is too long (max ${LIMITS[tooLong]} characters).` },
        { status: 400 }
      );
    }
    const investor = await prisma.user.findUnique({
      where: { id: investorId },
      select: { id: true, accountType: true, status: true },
    });
    if (!investor || investor.accountType !== "INVESTOR" || investor.status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "Investor not found." }, { status: 404 });
    }
    const existing = await prisma.pitchRequest.findFirst({
      where: { senderId: user.id, investorId, status: "PENDING" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "You already have a pending pitch request with this investor." },
        { status: 409 }
      );
    }
    const file = pitchDeckFile as File;
    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, message: "Pitch deck must be a PDF file." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { success: false, message: "Pitch deck must be non-empty and 120 MB or smaller." },
        { status: 400 }
      );
    }
    const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
    if (signature !== "%PDF-") {
      return NextResponse.json({ success: false, message: "The selected file is not a valid PDF." }, { status: 400 });
    }

    const pitchDeckUrl = await uploadFile(file, "pitches/requests");

    const pitchRequest = await prisma.pitchRequest.create({
      data: {
        senderId: user.id,
        investorId,
        companyName,
        problemStatement,
        proposedSolution,
        fundingRequirement: formatTargetAmount(fundingRequirement),
        equityOffered: equityOffered || null,
        message,
        pitchDeckUrl,
      },
      select: { id: true },
    });
    try {
      await prisma.notification.create({
        data: {
          userId: investorId,
          actorId: user.id,
          type: "SYSTEM",
          content: `${companyName} sent you a pitch request`,
          link: `/profile/${user.id}?pitchRequestId=${pitchRequest.id}`,
        },
      });
    } catch (notifyError) {
      console.error("Failed to notify investor of pitch request:", notifyError);
    }

    return NextResponse.json(
      { success: true, message: "Pitch request sent.", data: { id: pitchRequest.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create pitch request:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (id) {
      const pitch = await prisma.pitchRequest.findFirst({
        where: {
          id,
          OR: [{ investorId: user.id }, { senderId: user.id }],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              company: { select: { companyName: true, logoUrl: true } },
            },
          },
        },
      });

      if (!pitch) {
        return NextResponse.json({ success: false, message: "Pitch request not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: pitch });
    }

    const pitches = await prisma.pitchRequest.findMany({
      where: {
        OR: [{ investorId: user.id }, { senderId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: pitches });
  } catch (error) {
    console.error("Failed to fetch pitch requests:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;
    if (!id || !["ACCEPTED", "DECLINED", "REVIEWED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const pitch = await prisma.pitchRequest.findFirst({
      where: { id, investorId: user.id },
    });

    if (!pitch) {
      return NextResponse.json({ success: false, message: "Pitch request not found" }, { status: 404 });
    }

    const updated = await prisma.pitchRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update pitch request:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
