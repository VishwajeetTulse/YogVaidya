import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { TicketLogger } from "@/lib/utils/ticket-logger";
import type { Prisma } from "@prisma/client";

import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view ticket logs
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") as "day" | "week" | "month") || "day";
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");
    const level = searchParams.get("level");
    const ticketId = searchParams.get("ticketId");

    // Build filter conditions
    const where: Prisma.SystemLogWhereInput = {
      category: "TICKET",
    };

    // Apply timeframe filter
    const now = new Date();
    const timeframeMap = {
      day: 24 * 60 * 60 * 1000, // 1 day
      week: 7 * 24 * 60 * 60 * 1000, // 7 days
      month: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    const startTime = new Date(now.getTime() - timeframeMap[timeframe]);
    where.timestamp = { gte: startTime };

    // Apply additional filters
    if (action) where.action = action;
    if (level) where.level = level as Prisma.EnumLogLevelFilter;
    if (ticketId) {
      where.metadata = {
        path: ["ticketId"],
        equals: ticketId,
      } as Prisma.JsonNullableFilter;
    }

    try {
      // Fetch ticket logs
      const logs = await prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
      });

      // Get activity summary
      const summary = await TicketLogger.getTicketActivitySummary(timeframe);

      // Calculate additional statistics
      const stats = {
        totalLogs: logs.length,
        timeframe,
        summary: summary || {
          totalActions: 0,
          byAction: {},
          byLevel: {},
          byUser: {},
          recentActivity: [],
        },
      };

      return NextResponse.json({
        logs,
        stats,
        pagination: {
          limit,
          total: logs.length,
          hasMore: logs.length === limit,
        },
      });
    } catch (dbError) {
      console.error("Database error fetching ticket logs:", dbError);
      return NextResponse.json({
        logs: [],
        stats: {
          totalLogs: 0,
          timeframe,
          summary: {
            totalActions: 0,
            byAction: {},
            byLevel: {},
            byUser: {},
            recentActivity: [],
          },
        },
        pagination: {
          limit,
          total: 0,
          hasMore: false,
        },
      });
    }
  } catch (error) {
    console.error("Error in ticket logs API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to manually create log entries (for testing or special cases)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create manual logs
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { action, level, details, ticketId, ticketNumber, metadata } = await request.json();

    if (!action || !level || !details) {
      return NextResponse.json(
        { error: "action, level, and details are required" },
        { status: 400 }
      );
    }

    await TicketLogger.log({
      ticketId,
      ticketNumber,
      userId: session.user.id,
      action,
      level,
      details,
      metadata: {
        ...metadata,
        manualEntry: true,
        createdBy: session.user.id,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating manual ticket log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
