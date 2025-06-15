import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getSubscriptionAnalytics } from "@/lib/subscriptions";
import { format, subMonths } from "date-fns";

const prisma = new PrismaClient();

// Helper function to check if a date is within the last month
function isWithinLastMonth(date: Date): boolean {
  const oneMonthAgo = subMonths(new Date(), 1);
  return date >= oneMonthAgo;
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and has proper permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has moderator or admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch all users for user analytics
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        role: true,
      },
    });    // Get recent signups (within last month) - only users and mentors
    const recentSignups = allUsers.filter(user => 
      isWithinLastMonth(user.createdAt) && 
      (user.role === "USER" || user.role === "MENTOR")
    ).length;// Group users by role - include only USER and MENTOR roles
    let usersByRole = allUsers.reduce((acc, user) => {
      const role = user.role || "USER";
      // Only include USER and MENTOR roles
      if (role === "USER" || role === "MENTOR") {
        acc[role] = (acc[role] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Ensure USER and MENTOR roles exist in the response
    const displayRoles = ["USER", "MENTOR"];
    displayRoles.forEach(role => {
      if (usersByRole[role] === undefined) {
        usersByRole[role] = 0;
      }
    });

    // Get subscription data
    const subscriptionData = await getSubscriptionAnalytics();
    
    // Fetch mentor applications
    const mentorApplications = await prisma.mentorApplication.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    const pendingApplications = mentorApplications.filter(
      app => app.status === "pending"
    ).length;    // Calculate user growth for the last 3 months
    const now = new Date();
    const userGrowth = [];
    
    for (let i = 0; i < 3; i++) {
      const monthStart = subMonths(now, i);
      const monthEnd = i === 0 ? now : subMonths(now, i - 1);
      
      // Ensure we're using the correct month name for the period we're counting
      const monthToDisplay = format(monthStart, 'MMM');
        const usersInMonth = allUsers.filter(user => 
        user.createdAt >= monthStart && 
        user.createdAt < monthEnd &&
        (user.role === "USER" || user.role === "MENTOR")
      ).length;
      
      userGrowth.push({
        month: monthToDisplay,
        count: usersInMonth
      });
    }// Calculate subscription breakdown by plan
    const subscriptionsByPlan: Record<string, number> = {
      "SEED": 0,
      "BLOOM": 0,
      "FLOURISH": 0
    };
    
    if (subscriptionData.success && subscriptionData.analytics) {
      const planBreakdown = subscriptionData.analytics.planBreakdown;
      
      for (const plan in planBreakdown) {
        // Sum all active subscriptions for this plan
        if (subscriptionsByPlan[plan] !== undefined) {
          subscriptionsByPlan[plan] = planBreakdown[plan]["ACTIVE"] || 0;
        }
      }
    }    // Calculate total of only displayed roles (USER and MENTOR)
    const roleTotal = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);
    
    return NextResponse.json({
      users: {
        total: roleTotal, // Only count users and mentors in total
        recentSignups,
        byRole: usersByRole
      },
      subscriptions: {
        total: subscriptionData.success ? subscriptionData.analytics?.totalActiveSubscriptions || 0 : 0,
        byPlan: subscriptionsByPlan
      },
      mentorApplications: {
        total: mentorApplications.length,
        pending: pendingApplications
      },
      // Send the months chronologically (oldest first) for clearer visualization
      userGrowth: userGrowth.reverse() 
    });

  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: (error as Error).message },
      { status: 500 }
    );
  }
}
