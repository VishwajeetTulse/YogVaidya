import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
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

    // Search for user by email
    const targetUser = await prisma.user.findUnique({
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
      },
    });

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
