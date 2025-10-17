import { type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/error-handler";
import { errorResponse, successResponse } from "@/lib/utils/response-handler";

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

    // Calculate date ranges for current and previous month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Count new paying subscribers in current month
    // Only include users who have actually paid for subscriptions
    const currentMonthNewSubscribers = await prisma.user.count({
      where: {
        role: "USER", // Only count actual customers
        subscriptionStartDate: {
          gte: currentMonthStart,
        },
        AND: [
          { subscriptionPlan: { not: null } }, // Must have a subscription plan
          { paymentAmount: { gt: 0 } }, // Must have made a payment
          {
            OR: [
              { subscriptionStatus: "ACTIVE" },
              { subscriptionStatus: "ACTIVE_UNTIL_END" },
              { subscriptionStatus: "CANCELLED" }, // Include cancelled but paid users
            ],
          },
        ],
      },
    });

    // Count new paying subscribers in previous month
    const previousMonthNewSubscribers = await prisma.user.count({
      where: {
        role: "USER", // Only count actual customers
        subscriptionStartDate: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
        AND: [
          { subscriptionPlan: { not: null } }, // Must have a subscription plan
          { paymentAmount: { gt: 0 } }, // Must have made a payment
          {
            OR: [
              { subscriptionStatus: "ACTIVE" },
              { subscriptionStatus: "ACTIVE_UNTIL_END" },
              { subscriptionStatus: "CANCELLED" }, // Include cancelled but paid users
            ],
          },
        ],
      },
    });

    // Calculate growth rate
    let growthRate = 0;
    let growthDirection: "up" | "down" | "neutral" = "neutral";

    if (previousMonthNewSubscribers === 0) {
      // Handle division by zero - if we had 0 last month and any this month, it's 100% growth
      if (currentMonthNewSubscribers > 0) {
        growthRate = 100;
        growthDirection = "up";
      }
    } else {
      growthRate =
        ((currentMonthNewSubscribers - previousMonthNewSubscribers) / previousMonthNewSubscribers) *
        100;
      growthDirection = growthRate > 0 ? "up" : growthRate < 0 ? "down" : "neutral";
    }

    // Get additional breakdown for insights (only paying customers)
    const currentMonthBreakdown = {
      seedPlan: await prisma.user.count({
        where: {
          role: "USER",
          subscriptionStartDate: { gte: currentMonthStart },
          subscriptionPlan: "SEED",
          paymentAmount: { gt: 0 },
        },
      }),
      bloomPlan: await prisma.user.count({
        where: {
          role: "USER",
          subscriptionStartDate: { gte: currentMonthStart },
          subscriptionPlan: "BLOOM",
          paymentAmount: { gt: 0 },
        },
      }),
      flourishPlan: await prisma.user.count({
        where: {
          role: "USER",
          subscriptionStartDate: { gte: currentMonthStart },
          subscriptionPlan: "FLOURISH",
          paymentAmount: { gt: 0 },
        },
      }),
      totalRevenue: await prisma.user.aggregate({
        where: {
          role: "USER",
          subscriptionStartDate: { gte: currentMonthStart },
          paymentAmount: { gt: 0 },
        },
        _sum: {
          paymentAmount: true,
        },
      }),
    };

    const growthStats = {
      currentMonthNewSubscribers,
      previousMonthNewSubscribers,
      growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
      growthDirection,
      breakdown: currentMonthBreakdown,
      isFirstMonth: previousMonthNewSubscribers === 0 && currentMonthNewSubscribers > 0,
    };

    return successResponse(growthStats, 200, "Growth stats calculated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
