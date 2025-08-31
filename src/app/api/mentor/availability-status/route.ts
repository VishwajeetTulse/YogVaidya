import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get all mentors with their availability status
    const mentors = await prisma.user.findMany({
      where: {
        role: "MENTOR"
      },
      select: {
        id: true,
        email: true,
        name: true,
        mentorType: true,
        updatedAt: true
      }
    });

    console.log(`📊 Found ${mentors.length} mentors with MENTOR role`);

    // Get availability data separately to avoid TypeScript issues
    const mentorsWithAvailability = await Promise.all(
      mentors.map(async (mentor) => {
        try {
          // Use findUnique to get the isAvailable field
          const availabilityData = await prisma.user.findUnique({
            where: { id: mentor.id },
            select: { isAvailable: true }
          });
          
          const isAvailable = availabilityData?.isAvailable ?? true;
          console.log(`👤 ${mentor.name} (${mentor.email}): isAvailable = ${isAvailable}`);
          
          return {
            ...mentor,
            isAvailable: isAvailable
          };
        } catch (error) {
          console.error(`Error fetching availability for mentor ${mentor.id}:`, error);
          return {
            ...mentor,
            isAvailable: true // Fallback
          };
        }
      })
    );

    // Create a map of mentor email to availability for easy lookup
    const availabilityMap = mentorsWithAvailability.reduce((acc, mentor) => {
      if (mentor.email) {
        acc[mentor.email] = {
          isAvailable: mentor.isAvailable,
          lastUpdated: mentor.updatedAt,
          mentorType: mentor.mentorType
        };
      }
      return acc;
    }, {} as Record<string, { isAvailable: boolean; lastUpdated: Date; mentorType: string | null }>);

    console.log(`✅ Returning availability data: Available=${mentorsWithAvailability.filter(m => m.isAvailable).length}, Unavailable=${mentorsWithAvailability.filter(m => !m.isAvailable).length}`);

    return NextResponse.json({
      success: true,
      data: {
        mentors: mentorsWithAvailability,
        availabilityMap: availabilityMap,
        totalMentors: mentorsWithAvailability.length,
        availableMentors: mentorsWithAvailability.filter(m => m.isAvailable).length,
        unavailableMentors: mentorsWithAvailability.filter(m => !m.isAvailable).length
      }
    });

  } catch (error) {
    console.error("Error fetching mentors availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
