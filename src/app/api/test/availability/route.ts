import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

export async function GET(_request: NextRequest) {
  try {


    // Test 1: Check all users with MENTOR role
    const allMentors = await prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });



    // Test 2: Try to get isAvailable field for each mentor
    const mentorsWithAvailability = [];
    for (const mentor of allMentors) {
      try {
        // Try to access the full user record and extract isAvailable
        const fullUser = await prisma.user.findUnique({
          where: { id: mentor.id },
        });

        // Access isAvailable property directly from the object
        const isAvailable = fullUser?.isAvailable ?? true;

        mentorsWithAvailability.push({
          ...mentor,
          isAvailable: isAvailable,
        });


      } catch (error) {
        console.error(`❌ Error getting availability for ${mentor.name}:`, error);
        mentorsWithAvailability.push({
          ...mentor,
          isAvailable: true, // fallback
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMentors: allMentors.length,
        mentors: mentorsWithAvailability,
        message: "Database test completed - check server logs for details",
      },
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return NextResponse.json(
      {
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
