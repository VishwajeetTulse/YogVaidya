import { type NextRequest, NextResponse } from "next/server";
import { startAutoTrialForNewUser } from "@/lib/subscriptions";
import { auth } from "@/lib/config/auth";

import { AuthenticationError } from "@/lib/utils/error-handler";
import { successResponse } from "@/lib/utils/response-handler";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const trialResult = await startAutoTrialForNewUser(session.user.id);

    if (!trialResult.success) {
      // Don't treat "already has subscription" as a hard error
      if (
        "error" in trialResult &&
        trialResult.error === "User already has subscription or has used trial"
      ) {
        return NextResponse.json({
          success: true,
          data: null,
          message: trialResult.error,
        });
      }
      const errorMessage =
        "error" in trialResult
          ? trialResult.error
          : "message" in trialResult
            ? trialResult.message
            : "Unknown error";
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }

    return successResponse(trialResult);
  } catch (error) {
    console.error("Error starting trial:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: "Failed to start trial", details: errorMessage },
      { status: 500 }
    );
  }
}
