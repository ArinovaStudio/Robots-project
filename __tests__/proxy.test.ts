/**
 * Tests for proxy.ts (Next.js 16 route protection)
 * 
 * Since proxy.ts uses server-side Prisma calls via getUser(),
 * we mock the auth module to test the routing logic.
 */

import { NextRequest } from "next/server";

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  getUser: jest.fn(),
}));

import { getUser } from "@/lib/auth";
import proxy from "../proxy";

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;

function createRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("Proxy (Route Protection)", () => {
  afterEach(() => {
    mockGetUser.mockReset();
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
      mockGetUser.mockResolvedValueOnce({ user: null, error: "Unauthorized" });

      const res = await proxy(createRequest("/feed"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("should allow authenticated user to access /feed", async () => {
      mockGetUser.mockResolvedValueOnce({
        user: { id: "1", email: "a@b.com", role: "USER" } as any,
        error: null,
      });

      const res = await proxy(createRequest("/feed"));
      expect(res.status).not.toBe(307);
    });
  });

  describe("Admin protection", () => {
    it("should redirect non-admin users from /admin routes", async () => {
      mockGetUser.mockResolvedValueOnce({
        user: { id: "1", email: "user@test.com", role: "USER" } as any,
        error: null,
      });

      const res = await proxy(createRequest("/admin/dashboard"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/explore");
    });

    it("should allow admin users to access /admin routes", async () => {
      mockGetUser.mockResolvedValueOnce({
        user: { id: "1", email: "admin@test.com", role: "ADMIN" } as any,
        error: null,
      });

      const res = await proxy(createRequest("/admin/dashboard"));
      expect(res.status).not.toBe(307);
    });
  });
});
