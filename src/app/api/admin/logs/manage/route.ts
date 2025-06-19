import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logSystemEvent } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and admin role
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (session.user?.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "purgeOldLogs") {
      // Calculate date 90 days ago
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      // Delete logs older than 90 days
      const result = await prisma.systemLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });
      
      // Log the purge action
      await logSystemEvent(
        "Logs Purged",
        `Admin ${session.user.id} purged ${result.count} logs older than 90 days`,
        "INFO",
        { admin: session.user.email, deletedCount: result.count }
      );
      
      return NextResponse.json({ 
        success: true, 
        message: `Successfully purged ${result.count} logs older than 90 days` 
      });
    }
    
    if (action === "exportLogs") {
      const { format } = body;
      
      // Fetch all logs
      const logs = await prisma.systemLog.findMany({
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      
      // Format for export
      // For CSV, you would need to convert the logs to a CSV format
      // For JSON, you can just return the logs
      
      // Log the export action
      await logSystemEvent(
        "Logs Exported",
        `Admin ${session.user.id} exported logs in ${format} format`,
        "INFO",
        { admin: session.user.email, format, count: logs.length }
      );
      
      return NextResponse.json({ 
        success: true,
        logs,
        format,
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing logs:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
