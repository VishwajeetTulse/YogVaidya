import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

/**
 * POST /api/sessions/[sessionId]/start
 * Manually start a session, marking it as ONGOING without delay flag
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Find the session
    const sessionResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: sessionId }
    });

    let session: any = null;
    if (sessionResult && 
        typeof sessionResult === 'object' && 
        'cursor' in sessionResult &&
        sessionResult.cursor &&
        typeof sessionResult.cursor === 'object' &&
        'firstBatch' in sessionResult.cursor &&
        Array.isArray(sessionResult.cursor.firstBatch) &&
        sessionResult.cursor.firstBatch.length > 0) {
      session = sessionResult.cursor.firstBatch[0];
    }

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

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
        const originalStartTime = new Date(timeSlot.startTime);
        const originalEndTime = new Date(timeSlot.endTime);
        const durationMs = originalEndTime.getTime() - originalStartTime.getTime();
        expectedDurationMinutes = Math.round(durationMs / (60 * 1000));
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

    // Update session to ONGOING and record manual start time with expected duration
    const manualStartTime = new Date();
    await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [{
        q: { _id: sessionId },
        u: { 
          $set: { 
            status: 'ONGOING',
            isDelayed: false,
            manualStartTime: manualStartTime, // Record when the session was manually started
            expectedDuration: expectedDurationMinutes, // Store expected duration
            updatedAt: manualStartTime
          } 
        }
      }]
    });

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
