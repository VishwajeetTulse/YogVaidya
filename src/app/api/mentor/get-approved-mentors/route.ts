import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

export async function GET() {
  try {
    // Cache the entire mentor list with 5 minute TTL
    const mentorsData = await withCache(
      "mentors:approved:list:v2",
      async () => {
        // Get all approved mentor applications (only needed fields)
        const approvedApplications = await prisma.mentorApplication.findMany({
          where: { status: "approved" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            phone: true,
            expertise: true,
            experience: true,
            certifications: true,
            mentorType: true,
            profile: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Batch fetch corresponding users to avoid N+1 queries
        const applicationEmails = approvedApplications.map((app) => app.email).filter(Boolean);
        const applicationUserIds = approvedApplications
          .map((app) => app.userId)
          .filter((id): id is string => Boolean(id));

        const users = await prisma.user.findMany({
          where: {
            OR: [
              { email: { in: applicationEmails } },
              { id: { in: applicationUserIds } },
            ],
          },
          select: {
            id: true,
            email: true,
            image: true,
            phone: true,
            role: true,
            mentorType: true,
            sessionPrice: true,
            isAvailable: true,
          },
        });

        const usersByEmail = new Map(users.map((u) => [u.email, u]));
        const usersById = new Map(users.map((u) => [u.id, u]));

        const mentorsWithUserData = approvedApplications.map((application) => {
          const user = usersByEmail.get(application.email) ||
            (application.userId ? usersById.get(application.userId) : undefined);

          return {
            id: user?.id || application.userId, // Use actual user ID when available
            name: application.name,
            email: application.email,
            phone: application.phone,
            specialty: application.expertise,
            experience: application.experience,
            certifications: application.certifications,
            image: user?.image || "/assets/default-avatar.svg",
            available: user?.isAvailable ?? true,
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
        });

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
