import { NextResponse } from "next/server";

/**
 * Adds cache headers to a NextResponse
 * Uses Vercel's cache directives for optimal caching
 */
export function cacheResponse(
  response: NextResponse,
  ttl: number = 3600 // seconds
): NextResponse {
  response.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=86400`);
  return response;
}

/**
 * Creates a cached JSON response
 * Useful for static or semi-static data that benefits from caching
 */
export function cachedJsonResponse<T>(
  data: T,
  ttl: number = 3600,
  statusCode: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status: statusCode });
  return cacheResponse(response, ttl);
}

/**
 * Cache configuration for different endpoint types
 */
export const CACHE_CONFIG = {
  // Static data - long cache
  MENTORS_LIST: 300, // 5 minutes (mentors don't change frequently)
  USER_PROFILE: 60, // 1 minute (could change at any time)
  DIET_PLANS: 300, // 5 minutes
  SCHEDULES: 60, // 1 minute

  // Dynamic data - shorter cache
  SESSION_STATUS: 30, // 30 seconds
  AVAILABILITY: 60, // 1 minute
  TIMESLOTS: 60, // 1 minute

  // Rarely cached
  SEARCH: 0, // No cache for search
  PAYMENT: 0, // Never cache payment data
  AUTH: 0, // Never cache auth endpoints
};
