import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { withCache, CACHE_TTL } from "@/lib/cache/redis";

import { AuthenticationError, AuthorizationError } from "@/lib/utils/error-handler";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    // Check if user is moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
      throw new AuthorizationError("Access denied");
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email parameter is required",
        },
        { status: 400 }
      );
    }

    // Cache user lookup with 1 minute TTL
    const targetUser = await withCache(
      `moderator:user-lookup:${email}`,
      async () => {
        return await prisma.user.findUnique({
      where: { email },
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
        });
      },
      CACHE_TTL.SHORT
    );

    if (!targetUser) {
      return NextResponse.json({
        success: true,
        user: null,
        message: "User not found",
      });
    }

    // Only allow looking up actual customers (USER role)
    if (targetUser.role !== "USER") {
      return NextResponse.json(
        {
          success: false,
          error: "Can only lookup customer accounts",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: targetUser,
    });
  } catch (error) {
    console.error("Error looking up user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup user",
      },
      { status: 500 }
    );
  }
}
