/**
 * Route-level tests: /api/auth/otp/send is rate limited per IP and per email.
 * Prisma, email sending and the limiters are mocked (no DB, SMTP or Redis needed).
 */

const ok = { success: true, limit: 5, remaining: 3, retryAfterSec: 0 };
const blocked = { success: false, limit: 5, remaining: 0, retryAfterSec: 77 };

const ipCheck = jest.fn();
const emailCheck = jest.fn();
const emailReset = jest.fn();

jest.mock("@/lib/rate-limit", () => ({
  otpSendLimiter: { check: (...a: unknown[]) => ipCheck(...a) },
  otpSendEmailLimiter: {
    check: (...a: unknown[]) => emailCheck(...a),
    reset: (...a: unknown[]) => emailReset(...a),
  },
  getIP: () => "203.0.113.9",
}));

const prismaMock = {
  user: { findUnique: jest.fn() },
  otp: { upsert: jest.fn() },
};
jest.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const sendEmail = jest.fn();
jest.mock("@/lib/email", () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));
jest.mock("@/lib/template", () => ({ getOtpEmailTemplate: () => "<p>code</p>" }));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/otp/send/route";

const call = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/auth/otp/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );

const body = { email: "A@B.com", type: "RESET_PASSWORD" };

beforeEach(() => {
  jest.clearAllMocks();
  ipCheck.mockResolvedValue(ok);
  emailCheck.mockResolvedValue(ok);
  prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });
  prismaMock.otp.upsert.mockResolvedValue({});
  sendEmail.mockResolvedValue(true);
});

describe("POST /api/auth/otp/send rate limiting", () => {
  it("returns 429 with Retry-After when the IP is blocked, before reading the body", async () => {
    ipCheck.mockResolvedValue(blocked);
    const res = await call(body);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("77");
    expect(emailCheck).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 429 when the email is blocked, without touching the DB or sending mail", async () => {
    emailCheck.mockResolvedValue(blocked);
    const res = await call(body);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("77");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.otp.upsert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("limits by the lower-cased email, shared by both OTP types", async () => {
    await call(body);
    await call({ ...body, type: "VERIFY_EMAIL" });
    expect(emailCheck).toHaveBeenNthCalledWith(1, "a@b.com");
    expect(emailCheck).toHaveBeenNthCalledWith(2, "a@b.com");
  });

  it("does not spend an email attempt on invalid input", async () => {
    const res = await call({ email: "not-an-email", type: "RESET_PASSWORD" });
    expect(res.status).toBe(400);
    expect(emailCheck).not.toHaveBeenCalled();
  });

  it("blocks identically for an email with no account (no enumeration)", async () => {
    emailCheck.mockResolvedValue(blocked);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const unknown = await call(body);

    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });
    const known = await call(body);

    expect(unknown.status).toBe(known.status);
    expect(await unknown.json()).toEqual(await known.json());
  });

  it("sends the email when both limits allow it, and never clears the counter", async () => {
    const res = await call(body);
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(emailReset).not.toHaveBeenCalled();
  });
});
