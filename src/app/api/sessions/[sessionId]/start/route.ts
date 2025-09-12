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

    // Update session to ONGOING without delay flag and record manual start time
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
