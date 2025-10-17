import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import crypto from "crypto";
import { type Prisma } from "@prisma/client";

import { ValidationError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

// Log type definitions
export type LogEntry = {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  category: string;
  details?: string;
  level: string;
  metadata?:  Prisma.JsonValue; // Assuming metadata is stored as JSON
  ipAddress?: string;
  userAgent?: string;
};

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and admin/moderator role
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (session.user?.role !== "ADMIN" && session.user?.role !== "MODERATOR") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined;
    const level = url.searchParams.get("level") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

    // Build filter conditions for the database query
    const where: Prisma.SystemLogWhereInput = {};

    if (category) {
      where.category = category.toUpperCase() as Prisma.EnumLogCategoryFilter; // Cast to satisfy enum type
    }

    if (level) {
      where.level = level.toUpperCase() as Prisma.EnumLogLevelFilter; // Assuming enum values are uppercase in the database
    }

    if (userId) {
      where.userId = userId;
    }

    // Count total logs matching the criteria for pagination
    const totalLogs = await prisma.systemLog.count({
      where ,
    });

    // Query logs with pagination
    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: {
        timestamp: "desc", // Newest first
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    // Transform database results to match LogEntry type
    // @ts-nocheck
    const formattedLogs: LogEntry[] = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      userId: log.userId || undefined,
      action: log.action,
      category: log.category.toLowerCase(), // Convert to lowercase for consistency with frontend
      details: log.details || undefined,
      level: log.level.toLowerCase(), // Convert to lowercase for consistency with frontend
      metadata: log.metadata || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
    }));

    // Return response
    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: totalLogs,
        page,
        pageSize,
        totalPages: Math.ceil(totalLogs / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {

    // Verify authentication and admin/moderator role
    const session = await auth.api.getSession({ headers: req.headers });


    if (!session) {

      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (session.user?.role !== "ADMIN" && session.user?.role !== "MODERATOR") {

      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    // Parse request body
    const body = await req.json();

    const { action, category, details, level, metadata } = body;

    if (!action || !category || !level) {

      throw new ValidationError("Missing required fields");
    }

    // Get IP address and user agent
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Create the log entry
    const logEntry = await prisma.systemLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action,
        category,
        details,
        level,
        metadata,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, logEntry });
  } catch (error) {
    console.error("Error creating log entry:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

