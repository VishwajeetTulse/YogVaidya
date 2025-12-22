/**
 * Redis Cache Configuration for YogVaidya
 * Using Upstash Redis (Serverless, Vercel-friendly)
 */

import { Redis } from "@upstash/redis";

// Check if Redis is properly configured
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = !!(REDIS_URL && REDIS_TOKEN && REDIS_URL !== "" && REDIS_TOKEN !== "");

// Log Redis configuration status (without exposing credentials)
if (!isRedisConfigured) {
  console.warn("⚠️ [Redis] Missing credentials - caching will be disabled");
  console.warn("⚠️ [Redis] UPSTASH_REDIS_REST_URL:", REDIS_URL ? "✓ Set" : "✗ Missing");
  console.warn("⚠️ [Redis] UPSTASH_REDIS_REST_TOKEN:", REDIS_TOKEN ? "✓ Set" : "✗ Missing");
} else {
  console.warn("✓ [Redis] Configuration found - caching enabled");
  console.warn("✓ [Redis] URL:", REDIS_URL.substring(0, 30) + "...");
}

// Initialize Upstash Redis client only if configured
export const redis = isRedisConfigured ? new Redis({
  url: REDIS_URL!,
  token: REDIS_TOKEN!,
}) : null;

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
  // If Redis is not configured, skip caching
  if (!isRedisConfigured || !redis) {
    console.warn(`[Cache DISABLED] Fetching ${key} directly from DB`);
    return fetchFn();
  }

  try {
    // Try to get from cache
    const cached = await redis.get(key) as T | null;
    
    if (cached !== null) {
      console.warn(`✓ [Cache HIT] ${key}`);
      return cached;
    }

    console.warn(`○ [Cache MISS] ${key} - fetching fresh data`);
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache (fire and forget - don't block response)
    redis.setex(key, ttl, data).then(() => {
      console.warn(`✓ [Cache SET] ${key} (TTL: ${ttl}s)`);
    }).catch((err: unknown) => {
      console.error(`✗ [Cache Error] Failed to set ${key}:`, err);
    });
    
    return data;
  } catch (error) {
    // If Redis fails, log and return fresh data
    console.error("✗ [Cache Error] Redis operation failed:", error);
    return fetchFn();
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  if (!isRedisConfigured || !redis) {
    console.warn(`[Cache DISABLED] Cannot invalidate ${keyOrPattern}`);
    return;
  }

  try {
    if (keyOrPattern.includes("*")) {
      // Pattern matching - scan and delete
      const keys = await redis.keys(keyOrPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.warn(`✓ [Cache] Invalidated ${keys.length} keys matching ${keyOrPattern}`);
      }
    } else {
      // Single key delete
      await redis.del(keyOrPattern);
      console.warn(`✓ [Cache] Invalidated ${keyOrPattern}`);
    }
  } catch (error) {
    console.error("✗ [Cache Error] Failed to invalidate:", error);
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
  if (!redis) {
    return keys.map(() => null);
  }
  
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
  if (!redis) {
    return;
  }
  
  try {
    const pipeline = redis.pipeline();
    
    entries.forEach(({ key, value, ttl = CACHE_TTL.MEDIUM }) => {
      pipeline.setex(key, ttl, value);
    });
    
    await pipeline.exec();
    console.warn(`[Cache] Set ${entries.length} keys in batch`);
  } catch (error) {
    console.error("[Cache Error] mset failed:", error);
  }
}

/**
 * Check if caching is enabled and configured
 */
export function isCacheEnabled(): boolean {
  return isRedisConfigured;
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
