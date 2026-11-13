/**
 * Route-level tests: /api/auth/register is rate limited per IP and per email.
 * Prisma, bcrypt and the limiters are mocked, so no database or Redis is needed.
 */

const ok = { success: true, limit: 10, remaining: 5, retryAfterSec: 0 };
const blocked = { success: false, limit: 10, remaining: 0, retryAfterSec: 123 };

const ipCheck = jest.fn();
const emailCheck = jest.fn();
const emailReset = jest.fn();

jest.mock("@/lib/rate-limit", () => ({
  registerIpLimiter: { check: (...a: unknown[]) => ipCheck(...a) },
  registerEmailLimiter: {
    check: (...a: unknown[]) => emailCheck(...a),
    reset: (...a: unknown[]) => emailReset(...a),
  },
  getIP: () => "203.0.113.9",
}));

const prismaMock = {
  otp: { findUnique: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};
jest.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
jest.mock("bcryptjs", () => ({ __esModule: true, default: { hash: jest.fn().mockResolvedValue("hashed") } }));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";

const makeReq = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const valid = { email: "New@Example.com", password: "password123", otp: "123456" };

beforeEach(() => {
  jest.clearAllMocks();
  ipCheck.mockResolvedValue(ok);
  emailCheck.mockResolvedValue(ok);
  prismaMock.otp.findUnique.mockResolvedValue({ otp: "123456", expiresAt: new Date(Date.now() + 60_000) });
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("POST /api/auth/register rate limiting", () => {
  it("returns 429 with Retry-After when the IP is blocked, before touching the body or DB", async () => {
    ipCheck.mockResolvedValue(blocked);
    const res = await POST(makeReq(valid));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("123");
    expect((await res.json()).success).toBe(false);
    expect(emailCheck).not.toHaveBeenCalled();
    expect(prismaMock.otp.findUnique).not.toHaveBeenCalled();
  });

  it("returns 429 when the email is blocked, without checking the OTP", async () => {
    emailCheck.mockResolvedValue(blocked);
    const res = await POST(makeReq(valid));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("123");
    expect(prismaMock.otp.findUnique).not.toHaveBeenCalled();
  });

  it("limits by the normalised (lower-case) email", async () => {
    await POST(makeReq(valid));
    expect(emailCheck).toHaveBeenCalledWith("new@example.com");
  });

  it("does not spend an email attempt on invalid input", async () => {
    const res = await POST(makeReq({ ...valid, otp: "12" }));
    expect(res.status).toBe(400);
    expect(emailCheck).not.toHaveBeenCalled();
  });

  it("keeps the counter when the OTP is wrong", async () => {
    const res = await POST(makeReq({ ...valid, otp: "000000" }));
    expect(res.status).toBe(400);
    expect(emailReset).not.toHaveBeenCalled();
  });

  it("clears the email counter after a successful registration", async () => {
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(200);
    expect(emailReset).toHaveBeenCalledWith("new@example.com");
  });
});
