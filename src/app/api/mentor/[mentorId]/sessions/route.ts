import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import type { SessionBookingDocument } from "@/lib/types/sessions";
import type { MongoCommandResult } from "@/lib/types/mongodb";
import { withCache, CACHE_TTL } from "@/lib/cache/redis";

import { AuthenticationError } from "@/lib/utils/error-handler";

export async function GET(request: Request, { params }: { params: Promise<{ mentorId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { mentorId } = await params;

    const { prisma } = await import("@/lib/config/prisma");

    // Cache mentor-specific sessions with 1 minute TTL
    const sessionData = await withCache(
      `mentor:${mentorId}:user-sessions:${session.user.id}`,
      async () => {
        // Check for existing sessions with this mentor
        const existingSessions = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: {
        userId: session.user.id,
        mentorId: mentorId,
      },
    });

    // Parse the MongoDB result
    let sessions: SessionBookingDocument[] = [];
    if (
      existingSessions &&
      typeof existingSessions === "object" &&
      "cursor" in existingSessions &&
      existingSessions.cursor &&
      typeof existingSessions.cursor === "object" &&
      "firstBatch" in existingSessions.cursor &&
      Array.isArray(existingSessions.cursor.firstBatch)
    ) {
      sessions = (existingSessions as unknown as MongoCommandResult<SessionBookingDocument>).cursor!
        .firstBatch;
    }

    // Check for active sessions
    const activeSessions = sessions.filter(
      (session) => session.status === "SCHEDULED" || session.status === "ONGOING"
    );

    const completedSessions = sessions.filter((session) => session.status === "COMPLETED");

        return {
          hasActiveSessions: activeSessions.length > 0,
          activeSessionsCount: activeSessions.length,
          completedSessionsCount: completedSessions.length,
          totalSessionsCount: sessions.length,
          canBookNewSession: activeSessions.length === 0,
        };
      },
      CACHE_TTL.SHORT
    );

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error("Error checking user sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check sessions" },
      { status: 500 }
    );
  }
}
