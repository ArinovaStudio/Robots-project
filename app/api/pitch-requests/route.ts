import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoConnectUsers } from "@/lib/auto-connect";
import { uploadFile } from "@/lib/uploads";
import { formatTargetAmount } from "@/lib/utils";
import { checkRequestQuota, recordRequestAttempt, releaseRequestAttempt, quotaMessage } from "@/lib/request-quota";

const MAX_PDF_BYTES = 120 * 1024 * 1024;

const LIMITS = {
  companyName: 120,
  problemStatement: 2000,
  proposedSolution: 2000,
  fundingRequirement: 60,
  equityOffered: 30,
  message: 2000,
} as const;
const investorSelect = {
  id: true,
  name: true,
  image: true,
  investor: { select: { firmName: true, investorType: true } },
} as const;
const inFlightPitchRequests = new Set<string>();

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
    const lockKey = `${user.id}:${investorId}`;
    if (inFlightPitchRequests.has(lockKey)) {
      return NextResponse.json(
        { success: false, message: "A pitch request to this investor is already in progress. Please wait." },
        { status: 409 }
      );
    }
    inFlightPitchRequests.add(lockKey);

    try {
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
      const pending = await prisma.pitchRequest.findFirst({
        where: { senderId: user.id, investorId, status: "PENDING" },
        select: { id: true },
      });
      if (pending) {
        return NextResponse.json(
          { success: false, message: "You already have a pending pitch request with this investor." },
          { status: 409 }
        );
      }
      const quota = await checkRequestQuota("PITCH_REQUEST", user.id, investorId);
      if (quota.blocked) {
        return NextResponse.json(
          { success: false, message: quotaMessage("pitch request", "investor", quota), retryAt: quota.retryAt },
          { status: 429 }
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

      let pitchRequest;
      try {
        pitchRequest = await prisma.$transaction(async (tx) => {
          const racePending = await tx.pitchRequest.findFirst({
            where: { senderId: user.id, investorId, status: "PENDING" },
            select: { id: true },
          });
          if (racePending) {
            throw new Error("PITCH_ALREADY_EXISTS");
          }
          const raceQuota = await checkRequestQuota("PITCH_REQUEST", user.id, investorId, tx);
          if (raceQuota.blocked) {
            throw new Error("PITCH_QUOTA_EXCEEDED");
          }
          const createdPitch = await tx.pitchRequest.create({
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
          await recordRequestAttempt(tx, "PITCH_REQUEST", user.id, investorId, createdPitch.id);
          return createdPitch;
        });
      } catch (txError: any) {
        if (txError?.message === "PITCH_ALREADY_EXISTS") {
          return NextResponse.json(
            { success: false, message: "You already have a pending pitch request with this investor." },
            { status: 409 }
          );
        }
        if (txError?.message === "PITCH_QUOTA_EXCEEDED") {
          const quota = await checkRequestQuota("PITCH_REQUEST", user.id, investorId);
          return NextResponse.json(
            { success: false, message: quotaMessage("pitch request", "investor", quota), retryAt: quota.retryAt },
            { status: 429 }
          );
        }
        throw txError;
      }

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
    } finally {
      inFlightPitchRequests.delete(lockKey);
    }
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
              verificationStatus: true,
              company: {
                select: {
                  id: true,
                  companyName: true,
                  logoUrl: true,
                  type: true,
                  location: true,
                  description: true,
                },
              },
            },
          },
          investor: { select: investorSelect },
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
            verificationStatus: true,
            company: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                type: true,
                location: true,
                description: true,
              },
            },
          },
        },
        investor: { select: investorSelect },
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

    if (status === "ACCEPTED") {
      await autoConnectUsers(user.id, pitch.senderId);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update pitch request:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "BUSINESS") {
      return NextResponse.json({ success: false, message: "Only business accounts can edit pitch requests." }, { status: 403 });
    }
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }

    const formData = await req.formData();
    const get = (key: string) => formData.get(key)?.toString().trim() ?? "";
    const id = get("id");
    const companyName = get("companyName");
    const problemStatement = get("problemStatement");
    const proposedSolution = get("proposedSolution");
    const fundingRequirement = get("fundingRequirement");
    const equityOffered = get("equityOffered");
    const message = get("message");
    const deck = formData.get("pitchDeck");
    const pitchDeckFile = deck && typeof deck !== "string" ? deck : null;

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing request id" }, { status: 400 });
    }
    const missing: string[] = [];
    if (!companyName) missing.push("startup/company name");
    if (!problemStatement) missing.push("problem statement");
    if (!proposedSolution) missing.push("proposed solution");
    if (!fundingRequirement) missing.push("funding requirement");
    if (!message) missing.push("message to investor");
    if (missing.length > 0) {
      return NextResponse.json({ success: false, message: `Please provide: ${missing.join(", ")}.` }, { status: 400 });
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

    const existing = await prisma.pitchRequest.findFirst({ where: { id, senderId: user.id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Pitch request not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "The investor has already responded, so this pitch can no longer be edited." },
        { status: 409 }
      );
    }

    // Keep the current deck unless a new PDF was attached.
    let pitchDeckUrl = existing.pitchDeckUrl;
    if (pitchDeckFile) {
      const file = pitchDeckFile as File;
      if (file.type !== "application/pdf") {
        return NextResponse.json({ success: false, message: "Pitch deck must be a PDF file." }, { status: 400 });
      }
      if (file.size === 0 || file.size > MAX_PDF_BYTES) {
        return NextResponse.json({ success: false, message: "Pitch deck must be non-empty and 120 MB or smaller." }, { status: 400 });
      }
      const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
      if (signature !== "%PDF-") {
        return NextResponse.json({ success: false, message: "The selected file is not a valid PDF." }, { status: 400 });
      }
      pitchDeckUrl = await uploadFile(file, "pitches/requests");
    }

    let created;
    try {
      created = await prisma.$transaction(async (tx) => {
        // Re-check inside the transaction so an accept/decline can't slip in between.
        const deleted = await tx.pitchRequest.deleteMany({ where: { id, senderId: user.id, status: "PENDING" } });
        if (deleted.count === 0) throw new Error("PITCH_NOT_EDITABLE");
        await tx.notification.deleteMany({
          where: { userId: existing.investorId, actorId: user.id, link: { contains: `pitchRequestId=${id}` } },
        });
        const recreated = await tx.pitchRequest.create({
          data: {
            senderId: user.id,
            investorId: existing.investorId,
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
        // Editing re-creates the row, but it is the same request: keep its original attempt.
        const moved = await tx.requestAttempt.updateMany({
          where: { kind: "PITCH_REQUEST", requestId: id },
          data: { requestId: recreated.id },
        });
        if (moved.count === 0) await recordRequestAttempt(tx, "PITCH_REQUEST", user.id, existing.investorId, recreated.id);
        return recreated;
      });
    } catch (txError: any) {
      if (txError?.message === "PITCH_NOT_EDITABLE") {
        return NextResponse.json(
          { success: false, message: "The investor has already responded, so this pitch can no longer be edited." },
          { status: 409 }
        );
      }
      throw txError;
    }

    try {
      await prisma.notification.create({
        data: {
          userId: existing.investorId,
          actorId: user.id,
          type: "SYSTEM",
          content: `${companyName} sent you an updated pitch request`,
          link: `/profile/${user.id}?pitchRequestId=${created.id}`,
        },
      });
    } catch (notifyError) {
      console.error("Failed to notify investor of updated pitch request:", notifyError);
    }

    return NextResponse.json({ success: true, message: "Pitch request updated and re-sent.", data: { id: created.id } });
  } catch (error) {
    console.error("Failed to edit pitch request:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing request id" }, { status: 400 });
    }

    const pitch = await prisma.pitchRequest.findFirst({
      where: {
        id,
        OR: [{ investorId: user.id }, { senderId: user.id }],
      },
    });

    if (!pitch) {
      return NextResponse.json({ success: false, message: "Pitch request not found" }, { status: 404 });
    }

    if (pitch.senderId === user.id && pitch.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "This pitch request can no longer be cancelled." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.pitchRequest.delete({ where: { id } });
      await tx.notification.deleteMany({
        where: { userId: pitch.investorId, actorId: pitch.senderId, link: { contains: `pitchRequestId=${id}` } },
      });
      // Only the sender withdrawing their own pending request frees the attempt;
      // an investor deleting a request they received does not.
      if (pitch.senderId === user.id && pitch.status === "PENDING") {
        await releaseRequestAttempt(tx, "PITCH_REQUEST", id);
      }
    });

    return NextResponse.json({ success: true, message: "Pitch request deleted" });
  } catch (error) {
    console.error("Failed to delete pitch request:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}