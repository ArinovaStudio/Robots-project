jest.mock("@/lib/redis", () => ({ redis: {} }));

import Redis from "ioredis";
import { SlidingWindowCounter } from "@/lib/rate-limit";

const REDIS_URL = process.env.REDIS_URL;
const suite = REDIS_URL ? describe : describe.skip;
const WINDOW = 60 * 60 * 1000;
const LIMIT = 10;

suite("SlidingWindowCounter against real Redis", () => {
  let client: Redis;
  let prefix: string;
  let limiter: SlidingWindowCounter;

  beforeAll(() => {
    client = new Redis(REDIS_URL as string);
  });

  beforeEach(() => {
    prefix = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    limiter = new SlidingWindowCounter(prefix, LIMIT, WINDOW, client);
  });

  afterEach(async () => {
    const keys = await client.keys(`rl:${prefix}:*`);
    if (keys.length) await client.del(...keys);
  });

  afterAll(async () => {
    await client.quit();
  });

  it("lets exactly `limit` of 50 parallel requests through", async () => {
    const results = await Promise.all(
      Array.from({ length: 50 }, () => limiter.check("same-user"))
    );

    const allowed = results.filter((r) => r.success).length;
    const blocked = results.filter((r) => !r.success).length;

    expect(allowed).toBe(LIMIT);
    expect(blocked).toBe(40);
  });

  it("does not let blocked attempts inflate the counter", async () => {
    await Promise.all(Array.from({ length: 50 }, () => limiter.check("u")));

    const keys = await client.keys(`rl:${prefix}:u:*`);
    expect(keys).toHaveLength(1);
    // Blocked attempts are rolled back, so the stored count is exactly the limit.
    expect(Number(await client.get(keys[0]))).toBe(LIMIT);
  });

  it("always sets a TTL on the counter (no immortal keys)", async () => {
    await Promise.all(Array.from({ length: 50 }, () => limiter.check("ttl-user")));

    const keys = await client.keys(`rl:${prefix}:ttl-user:*`);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const ttl = await client.pttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(WINDOW * 2);
    }
  });

  it("keeps different keys independent under load", async () => {
    const calls = [
      ...Array.from({ length: 30 }, () => limiter.check("a")),
      ...Array.from({ length: 30 }, () => limiter.check("b")),
    ];
    const results = await Promise.all(calls);

    expect(results.slice(0, 30).filter((r) => r.success)).toHaveLength(LIMIT);
    expect(results.slice(30).filter((r) => r.success)).toHaveLength(LIMIT);
  });

  it("reset() clears the counter", async () => {
    await Promise.all(Array.from({ length: 15 }, () => limiter.check("r")));
    expect((await limiter.check("r")).success).toBe(false);

    await limiter.reset("r");
    expect((await limiter.check("r")).success).toBe(true);
  });
});