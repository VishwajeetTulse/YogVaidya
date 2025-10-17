import { type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/error-handler";
import { successResponse, errorResponse } from "@/lib/utils/response-handler";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      throw new AuthenticationError("User session not found");
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new AuthorizationError("Only admins can access this resource");
    }

    // Fetch all users with subscription data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        billingPeriod: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialUsed: true,
        isTrialActive: true,
        trialEndDate: true,
        paymentAmount: true,
        autoRenewal: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter to only show actual customers (USER role)
    const filteredUsers = users.filter((u) => u.role === "USER");

    return successResponse(filteredUsers, 200, "User subscriptions retrieved successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
