import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { updateSessionStatuses } from "@/lib/services/session-status-service";

export async function POST(_request: Request) {
  try {
    // Verify this is an internal cron request or from a trusted source
    const authHeader = (await headers()).get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use the service to update session statuses
    const updates = await updateSessionStatuses();

    const startedCount = updates.filter((u) => u.newStatus === "ONGOING").length;
    const completedCount = updates.filter((u) => u.newStatus === "COMPLETED").length;

    return NextResponse.json({
      success: true,
      message: `Session status updated: ${startedCount} sessions started, ${completedCount} sessions completed`,
      startedSessions: startedCount,
      completedSessions: completedCount,
      updates: updates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in session completion cron:", error);

    return NextResponse.json(
      { success: false, error: "Failed to complete sessions" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: Request) {
  return POST(request);
}
