/**
 * Route-level tests: /api/auth/otp/verify and /api/auth/reset-password are rate limited
 * per IP and per email. Prisma, bcrypt and the limiters are mocked (no DB or Redis needed).
 */

const ok = { success: true, limit: 10, remaining: 5, retryAfterSec: 0 };
const blocked = { success: false, limit: 10, remaining: 0, retryAfterSec: 123 };

const verifyIpCheck = jest.fn();
const verifyEmailCheck = jest.fn();
const verifyEmailReset = jest.fn();
const resetIpCheck = jest.fn();
const resetEmailCheck = jest.fn();
const resetEmailReset = jest.fn();

jest.mock("@/lib/rate-limit", () => ({
  otpVerifyLimiter: { check: (...a: unknown[]) => verifyIpCheck(...a) },
  otpVerifyEmailLimiter: {
    check: (...a: unknown[]) => verifyEmailCheck(...a),
    reset: (...a: unknown[]) => verifyEmailReset(...a),
  },
  resetIpLimiter: { check: (...a: unknown[]) => resetIpCheck(...a) },
  resetEmailLimiter: {
    check: (...a: unknown[]) => resetEmailCheck(...a),
    reset: (...a: unknown[]) => resetEmailReset(...a),
  },
  getIP: () => "203.0.113.9",
}));

const prismaMock = {
  otp: { findUnique: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
};
jest.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
jest.mock("bcryptjs", () => ({ __esModule: true, default: { hash: jest.fn().mockResolvedValue("hashed") } }));

import { NextRequest } from "next/server";
import { POST as verifyPOST } from "@/app/api/auth/otp/verify/route";
import { POST as resetPOST } from "@/app/api/auth/reset-password/route";

const makeReq = (path: string, body: unknown) =>
  new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const goodOtp = () => ({ otp: "123456", expiresAt: new Date(Date.now() + 60_000) });

beforeEach(() => {
  jest.clearAllMocks();
  for (const m of [verifyIpCheck, verifyEmailCheck, resetIpCheck, resetEmailCheck]) m.mockResolvedValue(ok);
  prismaMock.otp.findUnique.mockResolvedValue(goodOtp());
  prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com" });
  prismaMock.user.update.mockResolvedValue({});
  prismaMock.otp.delete.mockResolvedValue({});
});

describe("POST /api/auth/otp/verify rate limiting", () => {
  const body = { email: "A@B.com", otp: "123456", type: "RESET_PASSWORD" };
  const call = (b: unknown = body) => verifyPOST(makeReq("/api/auth/otp/verify", b));

  it("returns 429 with Retry-After when the IP is blocked, before touching the DB", async () => {
    verifyIpCheck.mockResolvedValue(blocked);
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("123");
    expect(verifyEmailCheck).not.toHaveBeenCalled();
    expect(prismaMock.otp.findUnique).not.toHaveBeenCalled();
  });

  it("returns 429 when the email is blocked, without checking the code", async () => {
    verifyEmailCheck.mockResolvedValue(blocked);
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("123");
    expect(prismaMock.otp.findUnique).not.toHaveBeenCalled();
  });

  it("keeps a separate guess budget per OTP type, using the lower-cased email", async () => {
    await call();
    await call({ ...body, type: "VERIFY_EMAIL" });
    expect(verifyEmailCheck).toHaveBeenNthCalledWith(1, "RESET_PASSWORD:a@b.com");
    expect(verifyEmailCheck).toHaveBeenNthCalledWith(2, "VERIFY_EMAIL:a@b.com");
  });

  it("does not spend an email attempt on invalid input", async () => {
    const res = await call({ ...body, otp: "12" });
    expect(res.status).toBe(400);
    expect(verifyEmailCheck).not.toHaveBeenCalled();
  });

  it("keeps the counter when the code is wrong", async () => {
    const res = await call({ ...body, otp: "000000" });
    expect(res.status).toBe(400);
    expect(verifyEmailReset).not.toHaveBeenCalled();
  });

  it("clears the email counter when the code is correct", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(verifyEmailReset).toHaveBeenCalledWith("RESET_PASSWORD:a@b.com");
  });
});

describe("POST /api/auth/reset-password rate limiting", () => {
  const body = { email: "A@B.com", otp: "123456", newPassword: "password123" };
  const call = (b: unknown = body) => resetPOST(makeReq("/api/auth/reset-password", b));

  it("returns 429 with Retry-After when the IP is blocked, before touching the body or DB", async () => {
    resetIpCheck.mockResolvedValue(blocked);
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("123");
    expect(resetEmailCheck).not.toHaveBeenCalled();
    expect(prismaMock.otp.findUnique).not.toHaveBeenCalled();
  });

  it("returns 429 when the email is blocked, without checking the OTP", async () => {
    resetEmailCheck.mockResolvedValue(blocked);
    const res = await call();
    expect(res.status).toBe(429);
    expect(prismaMock.otp.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("limits by the lower-cased email", async () => {
    await call();
    expect(resetEmailCheck).toHaveBeenCalledWith("a@b.com");
  });

  it("does not spend an email attempt on invalid input", async () => {
    const res = await call({ ...body, newPassword: "short" });
    expect(res.status).toBe(400);
    expect(resetEmailCheck).not.toHaveBeenCalled();
  });

  it("keeps the counter when the OTP is wrong", async () => {
    const res = await call({ ...body, otp: "000000" });
    expect(res.status).toBe(400);
    expect(resetEmailReset).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("clears the email counter after a successful reset", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(resetEmailReset).toHaveBeenCalledWith("a@b.com");
  });
});
