interface RateLimitInfo {
  count: number;
  resetTime: number;
}

class MemoryRateLimiter {
  private ipMap: Map<string, RateLimitInfo> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    let record = this.ipMap.get(ip);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + this.windowMs };
      this.ipMap.set(ip, record);
    }

    if (record.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: record.resetTime
      };
    }

    record.count++;
    
    // Periodically clean up old entries to prevent memory leaks
    if (Math.random() < 0.05) {
      this.cleanup(now);
    }

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      reset: record.resetTime
    };
  }

  private cleanup(now: number) {
    for (const [key, value] of this.ipMap.entries()) {
      if (value.resetTime < now) {
        this.ipMap.delete(key);
      }
    }
  }
}

// Global instances for different limits
// 5 attempts per 15 minutes for OTP/Login
export const authRateLimiter = new MemoryRateLimiter(5, 15 * 60 * 1000); 

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
