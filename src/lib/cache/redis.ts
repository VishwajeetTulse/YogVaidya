/**
 * Redis Cache Configuration for YogVaidya
 * Using Upstash Redis (Serverless, Vercel-friendly)
 */

import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Cache Time-To-Live (TTL) in seconds
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for semi-static data
  LONG: 1800, // 30 minutes - for static data
  VERY_LONG: 3600, // 1 hour - for rarely changing data
} as const;

/**
 * Cache key prefixes for organization
 */
export const CACHE_KEYS = {
  MENTORS: "mentors",
  MENTOR_DETAIL: "mentor",
  USER_PROFILE: "user",
  DASHBOARD: "dashboard",
  SESSIONS: "sessions",
  AVAILABILITY: "availability",
  STATS: "stats",
} as const;

/**
 * Generate cache key with consistent naming
 */
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(":")}`;
}

/**
 * Generic cache wrapper with automatic fallback
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);
    
    if (cached !== null) {
      console.log(`[Cache HIT] ${key}`);
      return cached;
    }

    console.log(`[Cache MISS] ${key}`);
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache (fire and forget - don't block response)
    redis.setex(key, ttl, data).catch((err) => {
      console.error(`[Cache Error] Failed to set ${key}:`, err);
    });
    
    return data;
  } catch (error) {
    // If Redis fails, log and return fresh data
    console.error("[Cache Error]", error);
    return fetchFn();
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  try {
    if (keyOrPattern.includes("*")) {
      // Pattern matching - scan and delete
      const keys = await redis.keys(keyOrPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Invalidated ${keys.length} keys matching ${keyOrPattern}`);
      }
    } else {
      // Single key delete
      await redis.del(keyOrPattern);
      console.log(`[Cache] Invalidated ${keyOrPattern}`);
    }
  } catch (error) {
    console.error("[Cache Error] Failed to invalidate:", error);
  }
}

/**
 * Cache tags for grouped invalidation
 */
export const CACHE_TAGS = {
  MENTOR_DATA: "mentor-data",
  USER_DATA: "user-data",
  SESSION_DATA: "session-data",
  BOOKING_DATA: "booking-data",
} as const;

/**
 * Tagged cache key generator
 */
export function getTaggedCacheKey(tag: string, key: string): string {
  return `${tag}:${key}`;
}

/**
 * Invalidate all keys with a specific tag
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  await invalidateCache(`${tag}:*`);
}

/**
 * Batch cache operations
 */
export async function mgetCache<T = unknown>(keys: string[]): Promise<(T | null)[]> {
  try {
    // Upstash Redis mget returns array of values or nulls
    const results = await redis.mget(...keys) as (T | null)[];
    return results;
  } catch (error) {
    console.error("[Cache Error] mget failed:", error);
    return keys.map(() => null);
  }
}

export async function msetCache(
  entries: Array<{ key: string; value: unknown; ttl?: number }>
): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    
    entries.forEach(({ key, value, ttl = CACHE_TTL.MEDIUM }) => {
      pipeline.setex(key, ttl, value);
    });
    
    await pipeline.exec();
    console.log(`[Cache] Set ${entries.length} keys in batch`);
  } catch (error) {
    console.error("[Cache Error] mset failed:", error);
  }
}

/**
 * Check if caching is enabled and configured
 */
export function isCacheEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Utility: Cache middleware for API routes
 */
export function cacheMiddleware(ttl: number = CACHE_TTL.MEDIUM) {
  return function <T>(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: unknown[]) {
      if (!isCacheEnabled()) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = `api:${propertyName}:${JSON.stringify(args)}`;
      
      return withCache(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}
