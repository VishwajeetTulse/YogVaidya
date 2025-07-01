import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Check if user has admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    // Fetch system logs from the database
    const logs = await prisma.systemLog.findMany({
        orderBy: { timestamp: "desc" }, // Most recent logs first
        take: 100,  // Limit to the most recent 100 logs
        });
    // Count logs by level
    const logsByLevel = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
      return NextResponse.json({
      total: logs.length,
      recent: logs.slice(0, 4), // Most recent 4 logs
      byLevel: logsByLevel
    });

  } catch (error) {
    console.error("System logs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system logs", details: (error as Error).message },
      { status: 500 }
    );
  }
}
