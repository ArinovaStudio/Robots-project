import { prisma } from "@/lib/prisma";

// MARKETPLACE_COLLABORATION covers business<->business, investor->business and business->investor proposals.
export type RequestKind = "PITCH_REQUEST" | "INVESTOR_COLLABORATION" | "MARKETPLACE_COLLABORATION";

// Tunable from the environment:
//   REQUEST_MAX_ATTEMPTS  - requests one sender may send to the same recipient before the cooling period (default 3)
//   REQUEST_COOLDOWN_DAYS - length of the cooling period in days, decimals allowed (default 7)
const positive = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
export const getRequestLimits = () => ({
  maxAttempts: Math.floor(positive(process.env.REQUEST_MAX_ATTEMPTS, 3)),
  cooldownMs: positive(process.env.REQUEST_COOLDOWN_DAYS, 7) * 24 * 60 * 60 * 1000,
});

export interface QuotaStatus {
  used: number;
  max: number;
  blocked: boolean;
  retryAt: Date | null;
}

// Walks the sender's attempts to one recipient oldest-first. Hitting the limit starts a cooling
// period that begins at the last allowed attempt; once it ends the count starts again from zero.
export function evaluateQuota(createdAts: Date[], now = new Date()): QuotaStatus {
  const { maxAttempts, cooldownMs } = getRequestLimits();
  let used = 0;
  let fullAt: number | null = null;
  for (const date of [...createdAts].sort((a, b) => a.getTime() - b.getTime())) {
    const t = date.getTime();
    if (fullAt !== null && t >= fullAt + cooldownMs) {
      used = 0;
      fullAt = null;
    }
    used += 1;
    if (used >= maxAttempts) fullAt = t;
  }
  if (fullAt !== null && now.getTime() >= fullAt + cooldownMs) {
    used = 0;
    fullAt = null;
  }
  return {
    used,
    max: maxAttempts,
    blocked: used >= maxAttempts,
    retryAt: fullAt !== null ? new Date(fullAt + cooldownMs) : null,
  };
}

type Db = Pick<typeof prisma, "requestAttempt">;

export async function checkRequestQuota(
  kind: RequestKind,
  senderId: string,
  recipientId: string,
  db: Db = prisma
): Promise<QuotaStatus> {
  const rows = await db.requestAttempt.findMany({
    where: { kind, senderId, recipientId },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return evaluateQuota(rows.map((r) => r.createdAt));
}

export function recordRequestAttempt(db: Db, kind: RequestKind, senderId: string, recipientId: string, requestId: string) {
  return db.requestAttempt.create({ data: { kind, senderId, recipientId, requestId } });
}

// The sender withdrew a request nobody has decided on yet, so it no longer counts.
export function releaseRequestAttempt(db: Db, kind: RequestKind, requestId: string) {
  return db.requestAttempt.deleteMany({ where: { kind, requestId } });
}

export function quotaMessage(noun: string, recipient: string, quota: QuotaStatus) {
  const when = quota.retryAt
    ? quota.retryAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "later";
  return `You've already sent ${quota.max} ${noun}s to this ${recipient}. You can send another after ${when}.`;
}
