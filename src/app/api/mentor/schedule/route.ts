import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { z } from "zod";
import { scheduleEmailReminder } from "@/lib/services/scheduleEmails";
import { prisma } from "@/lib/config/prisma";
import type { ScheduleDocument } from "@/lib/types/sessions";
import type { MongoCommandResult, DateValue } from "@/lib/types/mongodb";
import { isMongoDate } from "@/lib/types/mongodb";

import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/error-handler";

// Validation schema for schedule creation
const createScheduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledTime: z.string().min(1, "Please select a date and time"),
  link: z.string().url("Please enter a valid URL"),
  duration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(180, "Duration cannot exceed 3 hours"),
  sessionType: z.enum(["YOGA", "MEDITATION", "DIET"]),
});

// GET - Fetch scheduled sessions for the mentor
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      throw new AuthenticationError("Authentication required");
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      throw new AuthorizationError("Only mentors can access schedules");
    }

    // Fetch scheduled sessions from database using raw query to handle datetime conversion
    const scheduledSessionsResult = await prisma.$runCommandRaw({
      aggregate: "Schedule",
      pipeline: [
        {
          $match: { mentorId: user.id },
        },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                then: "$scheduledTime",
                else: {
                  $dateFromString: {
                    dateString: "$scheduledTime",
                    onError: null,
                  },
                },
              },
            },
          },
        },
        {
          $sort: { scheduledTime: -1 },
        },
      ],
      cursor: {},
    });

    // Helper to convert MongoDB dates
    const convertMongoDate = (dateValue: DateValue): Date | null => {
      if (!dateValue) return null;
      if (isMongoDate(dateValue)) return new Date(dateValue.$date);
      if (dateValue instanceof Date) return dateValue;
      return new Date(dateValue);
    };

    let scheduledSessions: ScheduleDocument[] = [];
    if (
      scheduledSessionsResult &&
      typeof scheduledSessionsResult === "object" &&
      "cursor" in scheduledSessionsResult &&
      scheduledSessionsResult.cursor &&
      typeof scheduledSessionsResult.cursor === "object" &&
      "firstBatch" in scheduledSessionsResult.cursor &&
      Array.isArray(scheduledSessionsResult.cursor.firstBatch)
    ) {
      const result = (scheduledSessionsResult as unknown as MongoCommandResult<ScheduleDocument>)
        .cursor!.firstBatch;
      scheduledSessions = result.map((session) => ({
        ...session,
        scheduledTime: session.scheduledTime ? convertMongoDate(session.scheduledTime) : null,
      })) as ScheduleDocument[];
    }

    // Transform the data to match the expected format
    const formattedSessions = scheduledSessions.map((session) => ({
      id: session.id,
      title: session.title,
      scheduledTime: session.scheduledTime,
      link: session.link,
      duration: session.duration,
      status: session.status,
      sessionType: session.sessionType,
      createdAt: session.createdAt,
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
      throw new AuthenticationError("Authentication required");
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      throw new AuthorizationError("Only mentors can create schedules");
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = createScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const scheduleData = validationResult.data;

    // Validate that the session type matches the mentor type
    const expectedSessionType =
      user.mentorType?.toString() === "MEDITATIONMENTOR"
        ? "MEDITATION"
        : user.mentorType?.toString() === "DIETPLANNER"
          ? "DIET"
          : "YOGA";
    if (scheduleData.sessionType !== expectedSessionType) {
      return NextResponse.json(
        {
          success: false,
          error: `Session type must be ${expectedSessionType} for your mentor type`,
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
      scheduledTime: newSession.scheduledTime,
      link: newSession.link,
      duration: newSession.duration,
      sessionType: newSession.sessionType,
      createdAt: newSession.createdAt,
    };
    scheduleEmailReminder(newSession);
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
      throw new AuthenticationError("Authentication required");
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      throw new AuthorizationError("Only mentors can update schedules");
    }

    // Get sessionId from URL parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      throw new ValidationError("Session ID is required");
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = createScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data",
          details: validationResult.error.errors,
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
      throw new NotFoundError("Session not found or unauthorized");
    }

    // Validate that the session type matches the mentor type
    const expectedSessionType =
      user.mentorType?.toString() === "MEDITATIONMENTOR"
        ? "MEDITATION"
        : user.mentorType?.toString() === "DIETPLANNER"
          ? "DIET"
          : "YOGA";
    if (scheduleData.sessionType !== expectedSessionType) {
      return NextResponse.json(
        {
          success: false,
          error: `Session type must be ${expectedSessionType} for your mentor type`,
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
      scheduledTime: updatedSession.scheduledTime,
      link: updatedSession.link,
      duration: updatedSession.duration,
      sessionType: updatedSession.sessionType,
      createdAt: updatedSession.createdAt,
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
      throw new AuthenticationError("Authentication required");
    }

    // Check if user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      throw new AuthorizationError("Only mentors can delete schedules");
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      throw new ValidationError("Session ID is required");
    }

    // Delete the scheduled session from database
    const deletedSession = await prisma.schedule.deleteMany({
      where: {
        id: sessionId,
        mentorId: user.id, // Ensure only the mentor can delete their own sessions
      },
    });

    if (deletedSession.count === 0) {
      throw new NotFoundError("Session not found or unauthorized");
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
