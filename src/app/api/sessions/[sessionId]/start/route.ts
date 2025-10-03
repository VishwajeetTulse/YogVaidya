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
