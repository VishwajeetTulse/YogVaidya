import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mentorId } = await params;

    const { prisma } = await import("@/lib/config/prisma");

    // Check for existing sessions with this mentor
    const existingSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        userId: session.user.id,
        mentorId: mentorId
      }
    });

    // Parse the MongoDB result
    let sessions: any[] = [];
    if (existingSessions && 
        typeof existingSessions === 'object' && 
        'cursor' in existingSessions &&
        existingSessions.cursor &&
        typeof existingSessions.cursor === 'object' &&
        'firstBatch' in existingSessions.cursor &&
        Array.isArray(existingSessions.cursor.firstBatch)) {
      sessions = existingSessions.cursor.firstBatch;
    }

    // Check for active sessions
    const activeSessions = sessions.filter((session: any) => 
      session.status === 'SCHEDULED' || session.status === 'ONGOING'
    );

    const completedSessions = sessions.filter((session: any) => 
      session.status === 'COMPLETED'
    );

    return NextResponse.json({
      success: true,
      data: {
        hasActiveSessions: activeSessions.length > 0,
        activeSessionsCount: activeSessions.length,
        completedSessionsCount: completedSessions.length,
        totalSessionsCount: sessions.length,
        canBookNewSession: activeSessions.length === 0
      }
    });

  } catch (error) {
    console.error("Error checking user sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check sessions" },
      { status: 500 }
    );
  }
}
