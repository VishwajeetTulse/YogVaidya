import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { cachedJsonResponse, CACHE_CONFIG } from "@/lib/middleware/cache-headers";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

// This route provides the same functionality as get-approved-mentors
// but at a different endpoint for consistency
export async function GET() {
  try {
    // Use Redis cache with 5 minute TTL
    const mentorsData = await withCache(
      "mentors:approved:list",
      async () => {
        // Get all approved mentor applications
        const approvedApplications = await prisma.mentorApplication.findMany({
      where: {
        status: "approved",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // OPTIMIZATION: Batch fetch all user data in a single query instead of N+1
    // Extract unique emails from applications
    const emails = approvedApplications.map((app) => app.email);

    // Fetch all users by email in ONE query
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
        id: true,
        name: true,
        image: true,
        phone: true,
        role: true,
        mentorType: true,
      },
    });

    // Create a map for O(1) lookup instead of searching through array
    const usersByEmail = new Map(users.map((user) => [user.email, user]));

    // Merge mentor applications with user data
    const mentorsWithUserData = approvedApplications.map((application) => {
      const user = usersByEmail.get(application.email);

      return {
        id: application.id,
        name: application.name,
        email: application.email,
        phone: application.phone,
        specialty: application.expertise,
        experience: application.experience,
        certifications: application.certifications,
        image: user?.image || "/assets/default-avatar.svg",
        available: true,
        description: `${application.expertise} specialist with ${application.experience} of experience`,
        bio:
          application.profile ||
          `Experienced ${application.expertise} practitioner dedicated to helping students achieve their wellness goals through personalized guidance and proven techniques.`,
        mentorType: application.mentorType,
        profile: application.profile,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        userRole: user?.role,
      };
    });

        return mentorsWithUserData;
      },
      CACHE_TTL.MEDIUM // 5 minutes
    );

    // Return cached response for mentors list (5 minute cache)
    return cachedJsonResponse(
      {
        success: true,
        mentors: mentorsData,
        count: mentorsData.length,
      },
      CACHE_CONFIG.MENTORS_LIST
    );
  } catch (error) {
    console.error("Error fetching approved mentors:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch approved mentors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Invalidate mentors cache when data changes
export async function POST() {
  try {
    await invalidateCache("mentors:approved:*");
    return NextResponse.json({ success: true, message: "Cache invalidated" });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
