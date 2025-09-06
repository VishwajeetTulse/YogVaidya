import { NextResponse } from "next/server";
import { updateSessionStatuses } from "@/lib/services/session-status-service";

export async function POST(request: Request) {
  try {
    console.log("🔄 Manual session status update triggered...");
    
    // Use the service to update session statuses
    const updates = await updateSessionStatuses();
    
    const startedCount = updates.filter(u => u.newStatus === 'ONGOING').length;
    const completedCount = updates.filter(u => u.newStatus === 'COMPLETED').length;

    console.log(`✅ Manual session update completed: ${startedCount} started, ${completedCount} completed`);

    return NextResponse.json({
      success: true,
      message: `Session status updated: ${startedCount} sessions started, ${completedCount} sessions completed`,
      startedSessions: startedCount,
      completedSessions: completedCount,
      updates: updates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in manual session update:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to update session statuses" },
      { status: 500 }
    );
  }
}

// Allow GET for easy browser testing
export async function GET(request: Request) {
  return POST(request);
}
