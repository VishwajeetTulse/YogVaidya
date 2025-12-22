/**
 * Test Cache Endpoint
 * Use this to verify Redis is working correctly
 * 
 * GET /api/test-cache - Test cache read/write
 * POST /api/test-cache - Clear test cache
 */

import { NextResponse } from "next/server";
import { redis, isCacheEnabled, withCache, CACHE_TTL } from "@/lib/cache/redis";

export async function GET() {
  try {
    // Check if cache is configured
    if (!isCacheEnabled()) {
      return NextResponse.json({
        success: false,
        error: "Redis not configured",
        message: "Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables",
      }, { status: 500 });
    }

    // Test basic operations
    const testKey = "test:connection";
    const testValue = {
      message: "Redis is working!",
      timestamp: new Date().toISOString(),
    };

    // Write test
    await redis.setex(testKey, 60, testValue);

    // Read test
    const cached = await redis.get(testKey);

    // Test withCache helper
    const cacheHelperTest = await withCache(
      "test:helper",
      async () => {
        return { helper: "working", time: Date.now() };
      },
      CACHE_TTL.SHORT
    );

    return NextResponse.json({
      success: true,
      message: "Redis connection successful!",
      tests: {
        basicWrite: "✅ Passed",
        basicRead: cached ? "✅ Passed" : "❌ Failed",
        helperFunction: cacheHelperTest ? "✅ Passed" : "❌ Failed",
      },
      data: {
        written: testValue,
        read: cached,
        helperResult: cacheHelperTest,
      },
    });
  } catch (error) {
    console.error("[Test Cache] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to connect to Redis",
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!isCacheEnabled()) {
      return NextResponse.json({
        success: false,
        error: "Redis not configured",
      }, { status: 500 });
    }

    // Clear test keys
    await redis.del("test:connection", "test:helper");

    return NextResponse.json({
      success: true,
      message: "Test cache cleared",
    });
  } catch (error) {
    console.error("[Test Cache] Clear error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
