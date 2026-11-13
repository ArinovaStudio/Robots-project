import { redis } from "@/lib/redis";

// Tolerance for floating-point noise in the window maths.
const EPSILON = 1e-6;

/** The small slice of the ioredis API the limiter needs (also makes it easy to fake in tests). */
export interface RateLimitStore {
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  pexpire(key: string, ms: number): Promise<number>;
  del(...keys: string[]): Promise<number>;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the caller can try again (0 when allowed). */
  retryAfterSec: number;
}

/**
 * Sliding window counter backed by Redis.
 *
 * Per key we keep one counter per fixed window (`<prefix>:<key>:<windowNumber>`).
 * The load over the last `windowMs` is estimated as:
 *
 *   previousCount * (share of previous window still inside the sliding window) + currentCount
 *
 * Counters expire on their own after two windows, so nothing needs cleaning up.
 */
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

      const currKey = this.counterKey(key, windowNumber);

      // INCR first: it is atomic, so parallel requests each get a unique count
      // and cannot all slip under the limit at the same moment.
      const curr = await this.store.incr(currKey);
      if (curr === 1) await this.store.pexpire(currKey, this.windowMs * 2);

      const prev = Number((await this.store.get(this.counterKey(key, windowNumber - 1))) ?? 0);
      const estimated = prev * prevWeight + curr;

      if (estimated > this.limit + EPSILON) {
        // Do not let blocked attempts extend the lockout.
        await this.store.decr(currKey);
        return {
          success: false,
          limit: this.limit,
          remaining: 0,
          retryAfterSec: this.retryAfterSec(prev, curr, elapsed),
        };
      }

      return {
        success: true,
        limit: this.limit,
        remaining: Math.max(0, Math.floor(this.limit - estimated)),
        retryAfterSec: 0,
      };
    } catch (err) {
      // Fail open: if Redis is down we would rather let people log in than lock everyone out.
      console.error(`[RATE LIMIT] ${this.prefix} check failed, allowing request:`, err);
      return { success: true, limit: this.limit, remaining: this.limit, retryAfterSec: 0 };
    }
  }

  /** Forget a key (e.g. the account counter after a successful login). */
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

  /**
   * How long until one more attempt would be allowed, assuming no further attempts.
   * `curr` is the count including the attempt that was just blocked.
   */
  private retryAfterSec(prev: number, curr: number, elapsed: number): number {
    const W = this.windowMs;
    const L = this.limit;
    let waitMs: number;

    if (curr > L) {
      // This window alone is over the limit: wait for it to end, then for it to fade
      // (it becomes the "previous" window, holding curr - 1 real attempts).
      const c = curr - 1;
      waitMs = W - elapsed + W * Math.max(1 - (L - 1) / c, 0);
    } else {
      waitMs = W - elapsed; // worst case: wait for this window to end
      // The previous window fades out linearly: solve prev*(1 - e/W) + curr <= L for e.
      if (prev > 0 && curr < L) {
        const needed = W * (1 - (L - curr) / prev);
        if (needed < W) waitMs = Math.max(needed - elapsed, 0);
      }
    }
    return Math.max(1, Math.ceil(waitMs / 1000 - EPSILON));
  }
}

const WINDOW_MS = 15 * 60 * 1000;

// Login: counted per IP and per account (email/username typed in the form).
export const loginIpLimiter = new SlidingWindowCounter("login-ip", 50, WINDOW_MS);
export const loginAccountLimiter = new SlidingWindowCounter("login-user", 10, WINDOW_MS);

// Registration: the email limiter is what stops guessing the 6-digit OTP through /register.
export const registerIpLimiter = new SlidingWindowCounter("register-ip", 20, WINDOW_MS);
export const registerEmailLimiter = new SlidingWindowCounter("register-email", 5, WINDOW_MS);

// OTP routes have their own budgets so they never use up login attempts.
export const otpSendLimiter = new SlidingWindowCounter("otp-send", 5, WINDOW_MS);
// Per email address (both OTP types together): stops flooding one inbox with codes from many IPs.
export const otpSendEmailLimiter = new SlidingWindowCounter("otp-send-email", 5, WINDOW_MS);
export const otpVerifyLimiter = new SlidingWindowCounter("otp-verify", 10, WINDOW_MS);
// Per (type + email): every /otp/verify call is a guess at that address's 6-digit code.
export const otpVerifyEmailLimiter = new SlidingWindowCounter("otp-verify-email", 5, WINDOW_MS);

// Password reset: the email limiter stops guessing the reset OTP through /reset-password.
export const resetIpLimiter = new SlidingWindowCounter("reset-ip", 20, WINDOW_MS);
export const resetEmailLimiter = new SlidingWindowCounter("reset-email", 5, WINDOW_MS);

// Helper function to extract IP safely in Next.js App Router
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
