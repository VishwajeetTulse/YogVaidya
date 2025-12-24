import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

export async function GET() {
  try {
    // Cache the entire mentor list with 5 minute TTL
    const mentorsData = await withCache(
      "mentors:approved:list:v2",
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

    // For each approved application, get the corresponding user data
    const mentorsWithUserData = await Promise.all(
      approvedApplications.map(async (application) => {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: application.email },
              { id: application.userId || "" }, // Use userId if available
            ],
          },
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            role: true,
            mentorType: true,
            sessionPrice: true,
          },
        });

        // Get availability separately to avoid TypeScript issues
        let isAvailable = true; // Default value
        try {
          const availabilityData = await prisma.user.findUnique({
            where: { id: user?.id || "" },
            select: { isAvailable: true },
          });
          isAvailable = availabilityData?.isAvailable ?? true;
        } catch (error) {
          console.error(`Error fetching availability for ${application.email}:`, error);
        }

        return {
          id: user?.id || application.userId, // Use actual user ID, not application ID
          name: application.name,
          email: application.email,
          phone: application.phone,
          specialty: application.expertise,
          experience: application.experience,
          certifications: application.certifications,
          image: user?.image || "/assets/default-avatar.svg", // Use user's image or default
          available: isAvailable, // Use real availability from database
          description: `${application.expertise} specialist with ${application.experience} of experience`,
          bio:
            application.profile ||
            `Experienced ${application.expertise} practitioner dedicated to helping students achieve their wellness goals through personalized guidance and proven techniques.`,
          mentorType: application.mentorType,
          profile: application.profile,
          sessionPrice: user?.sessionPrice || null,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
          userRole: user?.role,
        };
      })
    );

        return mentorsWithUserData;
      },
      CACHE_TTL.MEDIUM // 5 minutes
    );

    return NextResponse.json(
      {
        success: true,
        mentors: mentorsData,
        count: mentorsData.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
        }
      }
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

// POST - Invalidate mentors cache
export async function POST() {
  try {
    await invalidateCache("mentors:approved:*");
    return NextResponse.json({ success: true, message: "Mentors cache cleared" });
  } catch (error) {
    console.error("Error clearing mentors cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
