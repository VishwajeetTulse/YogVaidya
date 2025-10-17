import { getUserSessions } from "@/lib/server/user-sessions-server";

import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

// GET - Fetch user's available sessions based on subscription
export async function GET() {
  try {
    const result = await getUserSessions();

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in user sessions API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user sessions" },
      { status: 500 }
    );
  }
}
