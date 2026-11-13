/**
 * Tests for lib/rate-limit.ts
 *
 * SlidingWindowCounter is tested against an in-memory fake of the Redis commands it uses,
 * with Jest's fake clock, so no Redis server is needed.
 */

jest.mock("@/lib/redis", () => ({ redis: {} }));

import { SlidingWindowCounter, RateLimitStore, getIP } from "@/lib/rate-limit";

class FakeStore implements RateLimitStore {
  private data = new Map<string, { value: number; expiresAt: number }>();
  fail = false;

  private live(key: string) {
    const e = this.data.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= Date.now()) {
      this.data.delete(key);
      return undefined;
    }
    return e;
  }
  private guard() {
    if (this.fail) throw new Error("redis down");
  }
  async incr(key: string) {
    this.guard();
    const e = this.live(key);
    if (e) return ++e.value;
    this.data.set(key, { value: 1, expiresAt: Infinity });
    return 1;
  }
  async decr(key: string) {
    this.guard();
    const e = this.live(key);
    if (!e) return -1;
    return --e.value;
  }
  async get(key: string) {
    this.guard();
    const e = this.live(key);
    return e ? String(e.value) : null;
  }
  async pexpire(key: string, ms: number) {
    this.guard();
    const e = this.live(key);
    if (!e) return 0;
    e.expiresAt = Date.now() + ms;
    return 1;
  }
  async del(...keys: string[]) {
    this.guard();
    let n = 0;
    for (const k of keys) if (this.data.delete(k)) n++;
    return n;
  }
}

const WINDOW = 15 * 60 * 1000;
const MIN = 60 * 1000;

describe("SlidingWindowCounter", () => {
  let store: FakeStore;
  let limiter: SlidingWindowCounter;
  // A moment exactly at the start of a window, so the maths in the tests is easy to follow.
  const windowStart = Math.ceil(Date.UTC(2026, 0, 1) / WINDOW) * WINDOW;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(windowStart);
    store = new FakeStore();
    limiter = new SlidingWindowCounter("test", 10, WINDOW, store);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const hit = async (n: number, key = "a") => {
    const results = [];
    for (let i = 0; i < n; i++) results.push(await limiter.check(key));
    return results;
  };

  it("allows requests up to the limit and blocks the next one", async () => {
    const results = await hit(10);
    expect(results.every((r) => r.success)).toBe(true);

    const blocked = await limiter.check("a");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("reports remaining attempts", async () => {
    const [r1, r2, r3] = await hit(3);
    expect(r1.remaining).toBe(9);
    expect(r2.remaining).toBe(8);
    expect(r3.remaining).toBe(7);
  });

  it("does not let blocked attempts extend the lockout", async () => {
    await hit(10);
    await hit(5); // all blocked
    // Half a window later, the (still 10) previous-window weight is 0.5 -> only 5 + curr counts.
    jest.setSystemTime(windowStart + WINDOW + 7.5 * MIN);
    const next = await limiter.check("a");
    expect(next.success).toBe(true);
  });

  it("keeps different keys independent", async () => {
    await hit(10, "a");
    expect((await limiter.check("a")).success).toBe(false);
    expect((await limiter.check("b")).success).toBe(true);
  });

  describe("sliding behaviour", () => {
    it("frees the budget gradually instead of resetting at the window edge", async () => {
      // Use the whole budget near the END of window N (14 of 15 minutes in).
      jest.setSystemTime(windowStart + 14 * MIN);
      await hit(10);

      // 3.75 minutes into window N+1 the previous window still counts for 75%:
      // 10 * 0.75 = 7.5, so only 2 more attempts fit (3rd would be 10.5 > 10).
      jest.setSystemTime(windowStart + WINDOW + 3.75 * MIN);
      const results = await hit(4);
      expect(results.map((r) => r.success)).toEqual([true, true, false, false]);
    });

    it("tells the caller when to retry, and that time is accurate", async () => {
      jest.setSystemTime(windowStart + 14 * MIN);
      await hit(10);
      jest.setSystemTime(windowStart + WINDOW + 3.75 * MIN);
      await hit(2);

      const blocked = await limiter.check("a");
      expect(blocked.success).toBe(false);
      // Needs the previous window to fade to 70%: at 4.5 minutes, i.e. 45 seconds from now.
      expect(blocked.retryAfterSec).toBe(45);

      jest.setSystemTime(Date.now() + blocked.retryAfterSec * 1000);
      expect((await limiter.check("a")).success).toBe(true);
    });

    it("recovers fully after two quiet windows", async () => {
      await hit(10);
      expect((await limiter.check("a")).success).toBe(false);

      jest.setSystemTime(windowStart + 2 * WINDOW);
      const results = await hit(10);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("expires old counters from the store", async () => {
      await hit(3);
      jest.setSystemTime(windowStart + 3 * WINDOW);
      expect(await store.get(`rl:test:a:${Math.floor(windowStart / WINDOW)}`)).toBeNull();
    });
  });

  describe("reset", () => {
    it("clears a key so it starts from zero again", async () => {
      await hit(10);
      expect((await limiter.check("a")).success).toBe(false);

      await limiter.reset("a");
      const r = await limiter.check("a");
      expect(r.success).toBe(true);
      expect(r.remaining).toBe(9);
    });

    it("also clears the previous window", async () => {
      await hit(10);
      jest.setSystemTime(windowStart + WINDOW + 1 * MIN);
      await limiter.reset("a");
      expect((await hit(10)).every((r) => r.success)).toBe(true);
    });

    it("only affects the given key", async () => {
      await hit(10, "a");
      await hit(10, "b");
      await limiter.reset("a");
      expect((await limiter.check("a")).success).toBe(true);
      expect((await limiter.check("b")).success).toBe(false);
    });
  });

  describe("separate limiters", () => {
    it("do not share a budget even for the same key", async () => {
      const login = new SlidingWindowCounter("login", 3, WINDOW, store);
      const otp = new SlidingWindowCounter("otp", 3, WINDOW, store);
      await Promise.all([login.check("ip"), login.check("ip"), login.check("ip")]);
      expect((await login.check("ip")).success).toBe(false);
      expect((await otp.check("ip")).success).toBe(true);
    });
  });

  describe("when Redis is unavailable", () => {
    it("fails open instead of locking everyone out", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      store.fail = true;
      const r = await limiter.check("a");
      expect(r.success).toBe(true);
      await expect(limiter.reset("a")).resolves.toBeUndefined();
      spy.mockRestore();
    });
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
