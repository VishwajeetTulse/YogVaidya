import { type NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/lib/services/session-service";
import { mongoDateToISOString } from "@/lib/utils/datetime-utils";

/**
 * GET /api/test/session-service/[sessionId]
 * Test the session service with a specific session ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    console.log(`🧪 Testing SessionService with ID: ${sessionId}`);

    // Test session lookup
    const lookupResult = await SessionService.findSession(sessionId);

    // Test session stats
    const stats = await SessionService.getSessionStats();

    return NextResponse.json({
      success: true,
      test: {
        sessionId,
        lookupResult: {
          found: lookupResult.found,
          collection: lookupResult.collection,
          error: lookupResult.error,
          sessionData: lookupResult.session
            ? {
                id: lookupResult.session._id,
                status: lookupResult.session.status,
                type: lookupResult.session.sessionType,
                scheduled: mongoDateToISOString(
                  lookupResult.session.scheduledAt || lookupResult.session.scheduledTime
                ),
              }
            : null,
        },
        sessionStats: stats,
      },
    });
  } catch (error) {
    console.error("Error testing session service:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
