import { NextRequest, NextResponse } from "next/server";
import { getUserSessions } from "@/lib/server/user-sessions-server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 DEBUG: Testing getUserSessions function...");
    
    const result = await getUserSessions();
    
    console.log("🔧 DEBUG: getUserSessions result:", JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("🔧 DEBUG: Error in getUserSessions:", error);
    return NextResponse.json(
      { success: false, error: "Debug error: " + error },
      { status: 500 }
    );
  }
}
