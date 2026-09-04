/**
 * Tests for lib/rate-limit.ts
 * 
 * The MemoryRateLimiter class and getIP helper function.
 */

// We need to test the class directly since it's not exported.
// We'll test via the exported authRateLimiter instance and getIP.

import { authRateLimiter, getIP } from "@/lib/rate-limit";

describe("MemoryRateLimiter", () => {
  // We create a fresh limiter for isolated tests by accessing authRateLimiter.
  // Since authRateLimiter allows 5 requests per 15 minutes, we use that.

  const testIP = "192.168.1." + Math.floor(Math.random() * 255);

  it("should allow the first request", () => {
    const result = authRateLimiter.check(testIP);
    expect(result.success).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBeLessThanOrEqual(4);
  });

  it("should decrement remaining count on each call", () => {
    const uniqueIP = "10.0.0." + Math.floor(Math.random() * 255);
    
    const r1 = authRateLimiter.check(uniqueIP);
    expect(r1.remaining).toBe(4);

    const r2 = authRateLimiter.check(uniqueIP);
    expect(r2.remaining).toBe(3);

    const r3 = authRateLimiter.check(uniqueIP);
    expect(r3.remaining).toBe(2);
  });

  it("should block after exceeding the limit", () => {
    const uniqueIP = "172.16.0." + Math.floor(Math.random() * 255);

    // Use up all 5 requests
    for (let i = 0; i < 5; i++) {
      authRateLimiter.check(uniqueIP);
    }

    // 6th should be blocked
    const blocked = authRateLimiter.check(uniqueIP);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should return reset time in the future", () => {
    const uniqueIP = "10.10.10." + Math.floor(Math.random() * 255);
    const result = authRateLimiter.check(uniqueIP);
    expect(result.reset).toBeGreaterThan(Date.now());
  });
});

describe("getIP", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.50, 70.41.3.18" },
    });
    expect(getIP(req)).toBe("203.0.113.50");
  });

  it("should extract IP from x-real-ip header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.5" },
    });
    expect(getIP(req)).toBe("198.51.100.5");
  });

  it("should prefer x-forwarded-for over x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.50",
        "x-real-ip": "198.51.100.5",
      },
    });
    expect(getIP(req)).toBe("203.0.113.50");
  });

  it("should fallback to 127.0.0.1 when no headers present", () => {
    const req = new Request("http://localhost");
    expect(getIP(req)).toBe("127.0.0.1");
  });

  it("should trim whitespace from forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  203.0.113.50  , 70.41.3.18" },
    });
    expect(getIP(req)).toBe("203.0.113.50");
  });
});
