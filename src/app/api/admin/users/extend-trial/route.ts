import { type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";

import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new AuthorizationError("Access denied");
    }

    const { userId, extendDays } = await req.json();

    if (!userId || !extendDays) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID and extend days are required",
        },
        { status: 400 }
      );
    }

    // Get current user data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isTrialActive: true,
        trialEndDate: true,
        trialUsed: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // Calculate new trial end date
    let newTrialEndDate: Date;

    if (targetUser.isTrialActive && targetUser.trialEndDate) {
      // Extend existing trial
      newTrialEndDate = new Date(targetUser.trialEndDate);
      newTrialEndDate.setDate(newTrialEndDate.getDate() + extendDays);
    } else {
      // Start new trial or extend expired trial
      newTrialEndDate = new Date();
      newTrialEndDate.setDate(newTrialEndDate.getDate() + extendDays);
    }

    // Update the user with extended trial
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isTrialActive: true,
        trialEndDate: newTrialEndDate,
        trialUsed: true, // Mark that trial has been used
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        isTrialActive: true,
        trialEndDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Trial extended by ${extendDays} days until ${newTrialEndDate.toLocaleDateString("en-IN")}`,
    });
  } catch (error) {
    console.error("Error extending trial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extend trial",
      },
      { status: 500 }
    );
  }
}
