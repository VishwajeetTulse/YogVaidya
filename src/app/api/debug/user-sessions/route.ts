import { type NextRequest, NextResponse } from "next/server";
import { getUserSessions } from "@/lib/server/user-sessions-server";


export async function GET(_request: NextRequest) {
  try {
    const result = await getUserSessions();

    return NextResponse.json(result);
  } catch (error) {
    console.error("🔧 DEBUG: Error in getUserSessions:", error);
    return NextResponse.json({ success: false, error: "Debug error: " + error }, { status: 500 });
  }
}
