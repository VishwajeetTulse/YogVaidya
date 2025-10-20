// Simple in-memory rate limiter
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitOptions {
  interval: number; // in milliseconds
  maxRequests: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per interval
  }
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Initialize or get existing entry
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + options.interval,
    };
  }

  const entry = rateLimitStore[key];

  // Reset if interval has passed
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + options.interval;
  }

  // Check if limit exceeded
  const success = entry.count < options.maxRequests;

  if (success) {
    entry.count++;
  }

  const remaining = Math.max(0, options.maxRequests - entry.count);
  const resetTime = entry.resetTime;

  return { success, remaining, resetTime };
}

// Cleanup old entries to prevent memory leaks (run every 5 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const key in rateLimitStore) {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    }
  },
  5 * 60 * 1000
);
