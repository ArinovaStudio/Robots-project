import { redis } from "@/lib/redis";
const EPSILON = 1e-6;
const CHECK_SCRIPT = `
local curr = redis.call('INCR', KEYS[1])
if curr == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[3])
end
local prev = tonumber(redis.call('GET', KEYS[2]) or '0')
local estimated = prev * tonumber(ARGV[1]) + curr
if estimated > tonumber(ARGV[2]) + tonumber(ARGV[4]) then
  redis.call('DECR', KEYS[1])
  return {0, prev, curr}
end
return {1, prev, curr}
`;
export interface RateLimitStore {
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}
export class SlidingWindowCounter {
  constructor(
    private readonly prefix: string,
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly store: RateLimitStore = redis
  ) {}

  private counterKey(key: string, windowNumber: number) {
    return `rl:${this.prefix}:${key}:${windowNumber}`;
  }

  async check(key: string): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowNumber = Math.floor(now / this.windowMs);
      const elapsed = now - windowNumber * this.windowMs;
      const prevWeight = (this.windowMs - elapsed) / this.windowMs;
      const [allowed, prev, curr] = (await this.store.eval(
        CHECK_SCRIPT,
        2,
        this.counterKey(key, windowNumber), 
        this.counterKey(key, windowNumber - 1), 
        prevWeight, 
        this.limit, 
        this.windowMs * 2, 
        EPSILON 
      )) as [number, number, number];

      if (!allowed) {
        return {
          success: false,
          limit: this.limit,
          remaining: 0,
          retryAfterSec: this.retryAfterSec(Number(prev), Number(curr), elapsed),
        };
      }

      const estimated = Number(prev) * prevWeight + Number(curr);
      return {
        success: true,
        limit: this.limit,
        remaining: Math.max(0, Math.floor(this.limit - estimated)),
        retryAfterSec: 0,
      };
    } catch (err) {
      console.error(`[RATE LIMIT] ${this.prefix} check failed, allowing request:`, err);
      return { success: true, limit: this.limit, remaining: this.limit, retryAfterSec: 0 };
    }
  }
  async reset(key: string): Promise<void> {
    try {
      const windowNumber = Math.floor(Date.now() / this.windowMs);
      await this.store.del(
        this.counterKey(key, windowNumber),
        this.counterKey(key, windowNumber - 1)
      );
    } catch (err) {
      console.error(`[RATE LIMIT] ${this.prefix} reset failed:`, err);
    }
  }
  private retryAfterSec(prev: number, curr: number, elapsed: number): number {
    const W = this.windowMs;
    const L = this.limit;
    let waitMs: number;

    if (curr > L) {
      const c = curr - 1;
      waitMs = W - elapsed + W * Math.max(1 - (L - 1) / c, 0);
    } else {
      waitMs = W - elapsed; 
      if (prev > 0 && curr < L) {
        const needed = W * (1 - (L - curr) / prev);
        if (needed < W) waitMs = Math.max(needed - elapsed, 0);
      }
    }
    return Math.max(1, Math.ceil(waitMs / 1000 - EPSILON));
  }
}

const WINDOW_MS = 15 * 60 * 1000;
export const loginIpLimiter = new SlidingWindowCounter("login-ip", 50, WINDOW_MS);
export const loginAccountLimiter = new SlidingWindowCounter("login-user", 10, WINDOW_MS);
export const registerIpLimiter = new SlidingWindowCounter("register-ip", 20, WINDOW_MS);
export const registerEmailLimiter = new SlidingWindowCounter("register-email", 5, WINDOW_MS);

export const otpSendLimiter = new SlidingWindowCounter("otp-send", 5, WINDOW_MS);
export const otpSendEmailLimiter = new SlidingWindowCounter("otp-send-email", 5, WINDOW_MS);
export const otpVerifyLimiter = new SlidingWindowCounter("otp-verify", 10, WINDOW_MS);
export const otpVerifyEmailLimiter = new SlidingWindowCounter("otp-verify-email", 5, WINDOW_MS);
export const resetIpLimiter = new SlidingWindowCounter("reset-ip", 20, WINDOW_MS);
export const resetEmailLimiter = new SlidingWindowCounter("reset-email", 5, WINDOW_MS);
export function getIP(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "127.0.0.1";
}