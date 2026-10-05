/**
 * Tests for proxy.ts (Next.js 16 route protection)
 * 
 * Since proxy.ts uses server-side Prisma calls via getUser(),
 * we mock the auth module to test the routing logic.
 */

import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

import proxy from "../proxy";

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

function createRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("Proxy (Route Protection)", () => {
  afterEach(() => {
    mockGetToken.mockReset();
  });

  describe("Public pages", () => {
    it("should allow access to /login without auth", async () => {
      const res = await proxy(createRequest("/login"));
      // NextResponse.next() doesn't redirect
      expect(res.status).not.toBe(307);
    });

    it("should allow access to /signup without auth", async () => {
      const res = await proxy(createRequest("/signup"));
      expect(res.status).not.toBe(307);
    });

    it("should allow access to / (landing) without auth", async () => {
      const res = await proxy(createRequest("/"));
      expect(res.status).not.toBe(307);
    });

    it("should allow access to API routes without auth", async () => {
      const res = await proxy(createRequest("/api/auth/session"));
      expect(res.status).not.toBe(307);
    });
  });

  describe("Protected pages", () => {
    it("should redirect to /login when user is not authenticated", async () => {
      mockGetToken.mockResolvedValueOnce(null);

      const res = await proxy(createRequest("/feed"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("should allow authenticated user to access /feed", async () => {
      mockGetToken.mockResolvedValueOnce({ role: "USER" } as JWT);

      const res = await proxy(createRequest("/feed"));
      expect(res.status).not.toBe(307);
    });
  });

  describe("Admin protection", () => {
    it("should redirect non-admin users from /admin routes", async () => {
      mockGetToken.mockResolvedValueOnce({ role: "USER" } as JWT);

      const res = await proxy(createRequest("/admin"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/explore");
    });

    it("should allow admin users to access /admin routes", async () => {
      mockGetToken.mockResolvedValueOnce({ role: "ADMIN" } as JWT);

      const res = await proxy(createRequest("/admin"));
      expect(res.status).not.toBe(307);
    });
  });
});
