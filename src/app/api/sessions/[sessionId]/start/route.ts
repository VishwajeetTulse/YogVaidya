import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/lib/services/session-service";
import { prisma } from "@/lib/config/prisma";
import { convertMongoDate } from "@/lib/utils/datetime-utils";

/**
 * POST /api/sessions/[sessionId]/start
 * Manually start a session, marking it as ONGOING without delay flag
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Find the session using the robust service
    const lookupResult = await SessionService.findSession(sessionId);

    if (!lookupResult.found) {
      return NextResponse.json(
        { error: lookupResult.error || "Session not found" },
        { status: 404 }
      );
    }

    const session = lookupResult.session;

    // Check if session is in SCHEDULED status
    if (session.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: `Session is already ${session.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Calculate expected duration from time slot or use defaults
    let expectedDurationMinutes = 60; // Default 60 minutes

    if (session.timeSlotId) {
      // Get time slot details to calculate duration
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      if (timeSlotResult &&
          typeof timeSlotResult === 'object' &&
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {

        const timeSlot = timeSlotResult.cursor.firstBatch[0] as any;
        const originalStartTime = convertMongoDate(timeSlot.startTime);
        const originalEndTime = convertMongoDate(timeSlot.endTime);

        if (originalStartTime && originalEndTime) {
          const durationMs = originalEndTime.getTime() - originalStartTime.getTime();
          expectedDurationMinutes = Math.round(durationMs / (60 * 1000));
        }
      }
    } else {
      // Use default durations based on session type
      if (session.sessionType === 'YOGA') {
        expectedDurationMinutes = 60; // 1 hour for yoga
      } else if (session.sessionType === 'MEDITATION') {
        expectedDurationMinutes = 30; // 30 minutes for meditation
      } else if (session.sessionType === 'DIET') {
        expectedDurationMinutes = 45; // 45 minutes for diet consultation
      }
    }

    // Start the session using the robust service
    const updateResult = await SessionService.startSession(sessionId);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error || "Failed to start session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session started successfully",
      sessionId,
      newStatus: "ONGOING"
    });

  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}
