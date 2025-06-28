import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
// Validation schema for schedule creation
const createScheduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledTime: z.string().min(1, "Please select a date and time"),
  link: z.string().url("Please enter a valid URL"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(180, "Duration cannot exceed 3 hours"),
  sessionType: z.enum(["YOGA", "MEDITATION"]),
});

// GET - Fetch scheduled sessions for the mentor
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

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json(
        { success: false, error: "Only mentors can access schedules" },
        { status: 403 }
      );
    }

    // Fetch scheduled sessions from database
    const scheduledSessions = await prisma.schedule.findMany({
      where: { mentorId: user.id },
      orderBy: { scheduledTime: 'asc' },
    });

    // Transform the data to match the expected format
    const formattedSessions = scheduledSessions.map(session => ({
      id: session.id,
      title: session.title,
      scheduledTime: session.scheduledTime.toISOString(),
      link: session.link,
      duration: session.duration,
      status: session.status,
      sessionType: session.sessionType,
      createdAt: session.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("Error fetching scheduled sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scheduled sessions" },
      { status: 500 }
    );
  }
}

// POST - Create a new scheduled session
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json(
        { success: false, error: "Only mentors can create schedules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = createScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const scheduleData = validationResult.data;

    // Validate that the session type matches the mentor type
    const expectedSessionType = (user.mentorType && user.mentorType.toString() === "MEDITATIONMENTOR") ? "MEDITATION" : "YOGA";
    if (scheduleData.sessionType !== expectedSessionType) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Session type must be ${expectedSessionType} for your mentor type` 
        },
        { status: 400 }
      );
    }

    // Create new scheduled session in database
    const newSession = await prisma.schedule.create({
      data: {
        id: crypto.randomUUID(),
        title: scheduleData.title,
        scheduledTime: new Date(scheduleData.scheduledTime),
        link: scheduleData.link,
        duration: scheduleData.duration,
        sessionType: scheduleData.sessionType as "YOGA" | "MEDITATION",
        mentorId: user.id,
      },
    });

    // Transform the response to match the expected format
    const formattedSession = {
      id: newSession.id,
      title: newSession.title,
      scheduledTime: newSession.scheduledTime.toISOString(),
      link: newSession.link,
      duration: newSession.duration,
      sessionType: newSession.sessionType,
      createdAt: newSession.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      session: formattedSession,
      message: "Session scheduled successfully",
    });
  } catch (error) {
    console.error("Error creating scheduled session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create scheduled session" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing scheduled session
export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json(
        { success: false, error: "Only mentors can update schedules" },
        { status: 403 }
      );
    }

    // Get sessionId from URL parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = createScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const scheduleData = validationResult.data;

    // Check if the session exists and belongs to the mentor
    const existingSession = await prisma.schedule.findFirst({
      where: {
        id: sessionId,
        mentorId: user.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Validate that the session type matches the mentor type
    const expectedSessionType = (user.mentorType && user.mentorType.toString() === "MEDITATIONMENTOR") ? "MEDITATION" : "YOGA";
    if (scheduleData.sessionType !== expectedSessionType) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Session type must be ${expectedSessionType} for your mentor type` 
        },
        { status: 400 }
      );
    }

    // Update the scheduled session in database
    const updatedSession = await prisma.schedule.update({
      where: { id: sessionId },
      data: {
        title: scheduleData.title,
        scheduledTime: new Date(scheduleData.scheduledTime),
        link: scheduleData.link,
        duration: scheduleData.duration,
        sessionType: scheduleData.sessionType as "YOGA" | "MEDITATION",
      },
    });

    // Transform the response to match the expected format
    const formattedSession = {
      id: updatedSession.id,
      title: updatedSession.title,
      scheduledTime: updatedSession.scheduledTime.toISOString(),
      link: updatedSession.link,
      duration: updatedSession.duration,
      sessionType: updatedSession.sessionType,
      createdAt: updatedSession.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      session: formattedSession,
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating scheduled session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update scheduled session" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduled session
export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      return NextResponse.json(
        { success: false, error: "Only mentors can delete schedules" },
        { status: 403 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Delete the scheduled session from database
    const deletedSession = await prisma.schedule.deleteMany({
      where: {
        id: sessionId,
        mentorId: user.id, // Ensure only the mentor can delete their own sessions
      },
    });

    if (deletedSession.count === 0) {
      return NextResponse.json(
        { success: false, error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete scheduled session" },
      { status: 500 }
    );
  }
}
