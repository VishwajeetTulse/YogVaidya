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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Get subscription statistics
    const [totalActiveSubscriptions, totalTrialUsers, monthlyRevenue] = await Promise.all([
      // Active subscriptions count (only for customers with USER role)
      prisma.user.count({
        where: {
          role: "USER", // Only count actual customers
          OR: [{ subscriptionStatus: "ACTIVE" }, { subscriptionStatus: "ACTIVE_UNTIL_END" }],
        },
      }),

      // Trial users count (only for customers with USER role)
      prisma.user.count({
        where: {
          role: "USER", // Only count actual customers
          isTrialActive: true,
        },
      }),

      // Calculate monthly revenue (rough estimate)
      prisma.user.aggregate({
        where: {
          AND: [
            { role: "USER" }, // Only count actual customers
            { subscriptionStatus: "ACTIVE" },
            { paymentAmount: { gt: 0 } },
            { billingPeriod: "monthly" },
          ],
        },
        _sum: {
          paymentAmount: true,
        },
      }),
    ]);

    // Get recent activity (simplified)
    const recentActivity = [
      {
        user: "Recent subscription changes",
        action: "System monitoring active",
        timestamp: new Date().toISOString(),
      },
    ];

    // Get plan breakdown (only for customers with USER role)
    const planStats = await prisma.user.groupBy({
      by: ["subscriptionPlan", "subscriptionStatus"],
      where: {
        role: "USER", // Only count actual customers
      },
      _count: {
        id: true,
      },
    });

    const planBreakdown: Record<string, Record<string, number>> = {};
    planStats.forEach((stat) => {
      const plan = stat.subscriptionPlan || "None";
      const status = stat.subscriptionStatus || "None";

      if (!planBreakdown[plan]) {
        planBreakdown[plan] = {};
      }
      planBreakdown[plan][status] = stat._count.id;
    });

    const stats = {
      totalActiveSubscriptions,
      totalTrialUsers,
      monthlyRevenue: monthlyRevenue._sum.paymentAmount || 0,
      recentActivity,
      planBreakdown,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription stats",
      },
      { status: 500 }
    );
  }
}
