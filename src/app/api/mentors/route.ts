import { prisma } from "@/lib/config/prisma";

import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

// This route provides the same functionality as get-approved-mentors
// but at a different endpoint for consistency
export async function GET() {
  try {
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
            email: application.email,
          },
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            role: true,
            mentorType: true,
          },
        });

        return {
          id: application.id,
          name: application.name,
          email: application.email,
          phone: application.phone,
          specialty: application.expertise,
          experience: application.experience,
          certifications: application.certifications,
          image: user?.image || "/assets/default-avatar.svg", // Use user's image or default
          available: true, // All approved mentors are available by default
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
      })
    );

    return NextResponse.json({
      success: true,
      mentors: mentorsWithUserData,
      count: mentorsWithUserData.length,
    });
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
