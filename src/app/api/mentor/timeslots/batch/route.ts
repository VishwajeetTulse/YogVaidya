import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { withCache, CACHE_TTL } from "@/lib/cache/redis";

/**
 * GET /api/mentor/timeslots/batch
 * Fetch availability for multiple mentors in a single query
 * Query params: mentorIds=id1,id2,id3
 */
export async function GET(req: NextRequest) {
  try {
    // Get mentor IDs from query parameter
    const mentorIdsParam = req.nextUrl.searchParams.get("mentorIds");

    if (!mentorIdsParam) {
      return NextResponse.json({ error: "mentorIds query parameter is required" }, { status: 400 });
    }

    // Split and validate mentor IDs
    const mentorIds = mentorIdsParam.split(",").filter((id) => id.trim());

    if (mentorIds.length === 0) {
      return NextResponse.json({ error: "At least one mentor ID is required" }, { status: 400 });
    }

    // Cache key based on sorted mentor IDs to ensure consistent cache hits
    const sortedMentorIds = mentorIds.sort().join(",");
    const cacheKey = `timeslots:batch:${sortedMentorIds}`;

    const result = await withCache(
      cacheKey,
      async () => {
        // Single database query for all mentors' slots
        const availableSlots = await prisma.mentorTimeSlot.findMany({
          where: {
            mentorId: {
              in: mentorIds,
            },
            isActive: true,
            isBooked: false,
            startTime: {
              gte: new Date(), // Only future slots
            },
          },
          select: {
            mentorId: true,
            id: true,
          },
        });

        // Create availability map: mentorId -> hasAvailableSlots
        const availability: Record<string, boolean> = {};
        const mentorSlotSet = new Set(availableSlots.map((slot) => slot.mentorId));

        mentorIds.forEach((mentorId) => {
          availability[mentorId] = mentorSlotSet.has(mentorId);
        });

        return {
          success: true,
          availability,
          totalMentors: mentorIds.length,
          mentorsWithSlots:
            availableSlots.length > 0 ? mentorIds.filter((id) => availability[id]).length : 0,
        };
      },
      CACHE_TTL.SHORT
    );

    return NextResponse.json(result, {
      headers: {
        // Cache for 1 minute
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching batch timeslots:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch timeslot availability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
