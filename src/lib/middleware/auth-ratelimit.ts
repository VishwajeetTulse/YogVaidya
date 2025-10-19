import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/middleware/ratelimit";

export function authRateLimitMiddleware(req: NextRequest) {
  // Only rate limit sign-in and sign-up attempts
  const pathname = req.nextUrl.pathname;
  
  if (!pathname.includes("/auth/sign-in") && !pathname.includes("/auth/sign-up")) {
    return null;
  }

  // Get identifier (IP address)
  const ip = req.headers.get("x-forwarded-for") || 
             req.headers.get("x-real-ip") || 
             "unknown";

  // Rate limit: 5 attempts per 15 minutes per IP
  const result = rateLimit(ip, {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many authentication attempts. Please try again later.",
        resetTime: new Date(result.resetTime).toISOString(),
      },
      { status: 429 }
    );
  }

  return null;
}
