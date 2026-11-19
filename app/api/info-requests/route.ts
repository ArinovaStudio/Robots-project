import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPES = ["INVESTMENT_OFFER", "PITCH_REQUEST", "INVESTOR_COLLABORATION", "BUSINESS_COLLABORATION"] as const;
type RequestType = (typeof TYPES)[number];
const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

async function getParticipants(tx: any, requestType: RequestType, requestId: string) {
  switch (requestType) {
    case "INVESTMENT_OFFER": {
      const row = await tx.companyPitchOffer.findUnique({ where: { id: requestId }, include: { pitch: { select: { userId: true } } } });
      return row ? { first: row.pitch.userId, second: row.investorId } : null;
    }
    case "PITCH_REQUEST": {
      const row = await tx.pitchRequest.findUnique({ where: { id: requestId }, select: { senderId: true, investorId: true } });
      return row ? { first: row.investorId, second: row.senderId } : null;
    }
    case "INVESTOR_COLLABORATION": {
      const row = await tx.investorCollaboration.findUnique({ where: { id: requestId }, select: { requesterId: true, collaboratorId: true } });
      return row ? { first: row.collaboratorId, second: row.requesterId } : null;
    }
    case "BUSINESS_COLLABORATION": {
      const row = await tx.marketplaceCollaboration.findUnique({ where: { id: requestId }, select: { requesterId: true, recipientId: true } });
      return row ? { first: row.recipientId, second: row.requesterId } : null;
    }
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getOnboardedUser();
  if (error || !user) return fail(error || "Unauthorized", 401);
  const requestId = req.nextUrl.searchParams.get("requestId") || "";
  const requestType = req.nextUrl.searchParams.get("requestType") as RequestType;
  if (!requestId || !TYPES.includes(requestType)) return fail("A valid request ID and type are required.");
  const rounds = await prisma.infoRequest.findMany({
    where: { requestType, requestId },
    orderBy: { roundNumber: "asc" },
  });
  if (rounds.length === 0) return NextResponse.json({ success: true, data: null, rounds: [] });
  const latest = rounds[rounds.length - 1];
  if (rounds.some((round) => round.askedById !== user.id && round.answeringUserId !== user.id)) return fail("Forbidden", 403);
  const viewerRole = latest.askedById === user.id ? "asker" : "answerer";
  return NextResponse.json({
    success: true,
    data: { ...latest, viewerRole },
    rounds: rounds.map((round) => ({ ...round, viewerRole: round.askedById === user.id ? "asker" : "answerer" })),
    hasAnsweredRounds: rounds.some((round) => round.status === "ANSWERED"),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) return fail(error || "Unauthorized", 401);
    const body = await req.json();
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const requestType = body.requestType as RequestType;
    const questions = body.questions;
    if (!requestId || !TYPES.includes(requestType)) return fail("Invalid request details.");
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 20 || questions.some((q: unknown) => typeof q !== "string" || !q.trim() || q.trim().length > 500)) return fail("Provide between 1 and 20 valid questions (maximum 500 characters each).");
    const participants = await getParticipants(prisma, requestType, requestId);
    if (!participants) return fail("Request not found.", 404);
    if (participants.first !== user.id) return fail("Only the recipient of this request can ask questions.", 403);
    const latest = await prisma.infoRequest.findFirst({
      where: { requestType, requestId },
      orderBy: { roundNumber: "desc" },
    });
    if (latest && latest.askedById !== user.id) return fail("Only the original person who asked questions can start another round.", 403);
    if (latest?.status === "PENDING") return fail("Please wait until the current questions are answered before starting another round.", 409);
    const roundNumber = (latest?.roundNumber ?? 0) + 1;
    const created = await prisma.$transaction(async (tx) => {
      const info = await tx.infoRequest.create({ data: { requestId, requestType, roundNumber, askedById: user.id, answeringUserId: participants.second, questions: questions.map((q: string) => q.trim()) } });
      const status = requestType === "PITCH_REQUEST" || requestType === "INVESTOR_COLLABORATION" ? "REVIEWED" : "INFO_REQUESTED";
      if (requestType === "INVESTMENT_OFFER") await tx.companyPitchOffer.update({ where: { id: requestId }, data: { status } });
      if (requestType === "PITCH_REQUEST") await tx.pitchRequest.update({ where: { id: requestId }, data: { status } });
      if (requestType === "INVESTOR_COLLABORATION") await tx.investorCollaboration.update({ where: { id: requestId }, data: { status } });
      if (requestType === "BUSINESS_COLLABORATION") await tx.marketplaceCollaboration.update({ where: { id: requestId }, data: { status } });
      return info;
    });
    await prisma.notification.create({ data: { userId: participants.second, actorId: user.id, type: "SYSTEM", content: `${user.name || "A user"} sent you questions in information request round ${roundNumber}.`, link: requestType === "INVESTOR_COLLABORATION" ? `/investors/requests` : requestType === "PITCH_REQUEST" ? `/collaboration-requests?tab=investor` : `/collaboration-requests` } }).catch((e) => console.error("Info request notification failed:", e));
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return fail("Another information request round was created at the same time. Refresh and try again.", 409);
    console.error("Create info request failed:", e);
    return fail("Could not create the information request.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) return fail(error || "Unauthorized", 401);
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    const answers = body.answers;
    if (!id || !Array.isArray(answers) || answers.length < 1 || answers.length > 20 || answers.some((a: unknown) => typeof a !== "string" || !a.trim() || a.trim().length > 5000)) return fail("Answer every question before submitting.");
    const existing = await prisma.infoRequest.findUnique({ where: { id } });
    if (!existing) return fail("Information request not found.", 404);
    if (existing.answeringUserId !== user.id) return fail("Only the requested recipient can answer these questions.", 403);
    if (existing.status !== "PENDING") return fail("These questions have already been answered.", 409);
    const questions = Array.isArray(existing.questions) ? existing.questions : [];
    if (answers.length !== questions.length) return fail("Answer count must match the question count.");
    const updated = await prisma.infoRequest.updateMany({ where: { id, answeringUserId: user.id, status: "PENDING" }, data: { answers: answers.map((a: string) => a.trim()), status: "ANSWERED", answeredAt: new Date() } });
    if (updated.count !== 1) return fail("These questions have already been answered.", 409);
    const result = await prisma.infoRequest.findUnique({ where: { id } });
    await prisma.notification.create({ data: { userId: existing.askedById, actorId: user.id, type: "SYSTEM", content: `${user.name || "The recipient"} answered information request round ${existing.roundNumber}.`, link: existing.requestType === "PITCH_REQUEST" || existing.requestType === "INVESTOR_COLLABORATION" ? `/investors/requests` : `/collaboration-requests` } }).catch((e) => console.error("Info answer notification failed:", e));
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error("Submit info answers failed:", e);
    return fail("Could not submit answers.", 500);
  }
}
