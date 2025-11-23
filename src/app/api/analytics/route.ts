import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { getSubscriptionAnalytics } from "@/lib/subscriptions";
import { format, subMonths } from "date-fns";
import { prisma } from "@/lib/config/prisma";

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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has moderator or admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch all users for user analytics
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        role: true,
        mentorType: true,
        isAvailable: true,
        subscriptionStatus: true,
        trialUsed: true,
      },
    }); // Get recent signups (within last month) - only users and mentors for growth calculation
    const recentSignups = allUsers.filter(
      (user) =>
        isWithinLastMonth(user.createdAt) && (user.role === "USER" || user.role === "MENTOR")
    ).length;

    // Group users by role - include ALL roles for admin visibility
    const usersByRole = allUsers.reduce(
      (acc, user) => {
        const role = user.role || "USER";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Ensure all possible roles exist in the response with 0 count if none exist
    const allPossibleRoles = ["USER", "MENTOR", "ADMIN", "MODERATOR"];
    allPossibleRoles.forEach((role) => {
      if (usersByRole[role] === undefined) {
        usersByRole[role] = 0;
      }
    });

    // Calculate mentor analytics
    const mentors = allUsers.filter((user) => user.role === "MENTOR");
    const totalMentors = mentors.length;
    const activeMentors = mentors.filter((mentor) => mentor.isAvailable).length;

    // Group mentors by type
    const mentorsByType = mentors.reduce(
      (acc, mentor) => {
        const type = mentor.mentorType || "UNSPECIFIED";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate system log analytics
    const systemLogs = await prisma.systemLog.findMany({
      select: {
        id: true,
        category: true,
        level: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1000, // Limit to recent logs for performance
    });

    const logsByCategory = systemLogs.reduce(
      (acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const logsByLevel = systemLogs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate session scheduling analytics
    const schedules = await prisma.schedule.findMany({
      select: {
        id: true,
        sessionType: true,
        status: true,
        scheduledTime: true,
        duration: true,
        createdAt: true,
      },
    });

    const sessionsByType = schedules.reduce(
      (acc, schedule) => {
        acc[schedule.sessionType] = (acc[schedule.sessionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sessionsByStatus = schedules.reduce(
      (acc, schedule) => {
        acc[schedule.status] = (acc[schedule.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalSessionsScheduled = schedules.length;
    const completedSessions = schedules.filter((s) => s.status === "COMPLETED").length;
    const completionRate =
      totalSessionsScheduled > 0
        ? Math.round((completedSessions / totalSessionsScheduled) * 100)
        : 0;

    // Calculate real conversion rates
    const trialUsers = allUsers.filter((user) => user.trialUsed === true).length;
    const activeSubscribers = allUsers.filter(
      (user) => user.subscriptionStatus === "ACTIVE"
    ).length;
    const realTrialToSubscriptionRate =
      trialUsers > 0 ? Math.round((activeSubscribers / trialUsers) * 100) : 0;

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

    const pendingApplications = mentorApplications.filter((app) => app.status === "pending").length;

    const approvedApplications = mentorApplications.filter(
      (app) => app.status === "approved"
    ).length;

    const rejectedApplications = mentorApplications.filter(
      (app) => app.status === "rejected"
    ).length; // Calculate user growth for the last 3 months
    const now = new Date();
    const userGrowth = [];
    for (let i = 0; i < 3; i++) {
      // Get the current month being analyzed
      const currentMonth = subMonths(now, i);

      // Set start date to beginning of the current month
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Set end date to beginning of next month
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

      // Use the current month name for display
      const monthToDisplay = format(currentMonth, "MMM");
      const usersInMonth = allUsers.filter(
        (user) =>
          user.createdAt >= monthStart &&
          user.createdAt < monthEnd &&
          (user.role === "USER" || user.role === "MENTOR")
      ).length;

      userGrowth.unshift({
        month: monthToDisplay,
        count: usersInMonth,
      });
    } // Calculate subscription breakdown by plan
    const subscriptionsByPlan: Record<string, number> = {
      SEED: 0,
      BLOOM: 0,
      FLOURISH: 0,
    };

    if (subscriptionData.success && subscriptionData.analytics) {
      const planBreakdown = subscriptionData.analytics.planBreakdown;

      for (const plan in planBreakdown) {
        // Sum all active subscriptions for this plan
        if (subscriptionsByPlan[plan] !== undefined) {
          subscriptionsByPlan[plan] = planBreakdown[plan]["ACTIVE"] || 0;
        }
      }
    }

    // Calculate total of all users (including all roles)
    const roleTotal = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);

    // Calculate paying users (USER role only) for subscription percentage calculations
    const payingUsers = usersByRole.USER || 0;

    // Calculate platform users (USER + MENTOR) excluding internal staff (ADMIN + MODERATOR)
    const platformUsers = (usersByRole.USER || 0) + (usersByRole.MENTOR || 0);

    return NextResponse.json({
      users: {
        total: roleTotal, // Count all users including admins and moderators
        platformUsers, // Only actual platform users (USER + MENTOR)
        payingUsers, // Only normal users who can have subscriptions
        recentSignups,
        byRole: usersByRole,
        createdAt: allUsers.map((user) => user.createdAt.toISOString()),
      },
      subscriptions: {
        total: subscriptionData.success
          ? subscriptionData.analytics?.totalActiveSubscriptions || 0
          : 0,
        byPlan: subscriptionsByPlan,
        createdAt: subscriptionData.success ? subscriptionData.createdAt : [],
      },
      mentorApplications: {
        total: mentorApplications.length,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        createdAt: mentorApplications.map((app) => app.createdAt.toISOString()),
      },
      mentorAnalytics: {
        totalMentors,
        activeMentors,
        availabilityRate: totalMentors > 0 ? Math.round((activeMentors / totalMentors) * 100) : 0,
        mentorsByType,
      },
      systemLogAnalytics: {
        totalLogs: systemLogs.length,
        logsByCategory,
        logsByLevel,
      },
      sessionAnalytics: {
        totalSessions: totalSessionsScheduled,
        completedSessions,
        completionRate,
        sessionsByType,
        sessionsByStatus,
      },
      conversionAnalytics: {
        trialUsers,
        activeSubscribers,
        trialToSubscriptionRate: realTrialToSubscriptionRate,
      },
      // Send the months chronologically (oldest first) for clearer visualization
      userGrowth: userGrowth,
      // Revenue growth calculation based on actual subscription data will be added in future iteration
      // For now, removing fake revenueGrowth to avoid misleading data
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: (error as Error).message },
      { status: 500 }
    );
  }
}
