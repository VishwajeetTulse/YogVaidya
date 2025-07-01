import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch available sessions for users to book
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get('sessionType'); // YOGA or MEDITATION
    const upcomingOnly = searchParams.get('upcomingOnly') === 'true';

    // Build the query filters
    const filters: any = {};
    
    if (sessionType && (sessionType === 'YOGA' || sessionType === 'MEDITATION')) {
      filters.sessionType = sessionType;
    }
    
    if (upcomingOnly) {
      filters.scheduledTime = {
        gte: new Date()
      };
    }

    // Fetch available sessions from database with mentor information
    const availableSessions = await prisma.schedule.findMany({
      where: filters,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorType: true,
          }
        }
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // Transform the data to include mentor details
    const formattedSessions = availableSessions.map(session => ({
      id: session.id,
      title: session.title,
      scheduledTime: session.scheduledTime.toISOString(),
      duration: session.duration,
      sessionType: session.sessionType,
      mentor: {
        id: session.mentor.id,
        name: session.mentor.name,
        mentorType: session.mentor.mentorType,
      },
      createdAt: session.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("Error fetching available sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch available sessions" },
      { status: 500 }
    );
  }
}
