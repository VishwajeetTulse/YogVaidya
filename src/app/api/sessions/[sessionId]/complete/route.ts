import { type NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/lib/services/session-service";


/**
 * POST /api/sessions/[sessionId]/complete
 * Manually complete a session, including delayed sessions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
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

    // Check if session is in ONGOING status
    if (!session || session.status !== "ONGOING") {
      return NextResponse.json(
        {
          error: `Session must be ongoing to complete. Current status: ${session?.status || "unknown"}`,
        },
        { status: 400 }
      );
    }

    // Complete the session using the robust service
    const updateResult = await SessionService.completeSession(sessionId);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error || "Failed to complete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session completed successfully",
      sessionId,
      newStatus: "COMPLETED",
    });
  } catch (error) {
    console.error("Error completing session:", error);
    return NextResponse.json({ error: "Failed to complete session" }, { status: 500 });
  }
}
