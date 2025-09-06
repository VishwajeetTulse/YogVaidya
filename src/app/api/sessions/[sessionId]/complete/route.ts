import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

/**
 * POST /api/sessions/[sessionId]/complete
 * Manually complete a session, including delayed sessions
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

    // Check if session is in ONGOING status
    if (session.status !== 'ONGOING') {
      return NextResponse.json(
        { error: `Session must be ongoing to complete. Current status: ${session.status}` },
        { status: 400 }
      );
    }

    // Update session to COMPLETED
    await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [{
        q: { _id: sessionId },
        u: { 
          $set: { 
            status: 'COMPLETED',
            updatedAt: new Date()
          } 
        }
      }]
    });

    return NextResponse.json({
      success: true,
      message: session.isDelayed ? "Delayed session completed successfully" : "Session completed successfully",
      sessionId,
      newStatus: "COMPLETED",
      wasDelayed: Boolean(session.isDelayed)
    });

  } catch (error) {
    console.error("Error completing session:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
