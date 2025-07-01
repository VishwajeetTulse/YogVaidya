import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    
    // Convert logs to CSV format - excluding IP and user agent
    const headers = ['id', 'timestamp', 'userId', 'userName', 'userEmail', 'action', 'category', 'details', 'level'];
    const csvRows = [headers.join(',')];
    // @ts-nocheck
    logs.forEach((log) => {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.userId || '',
        `"${(log.user?.name || '').replace(/"/g, '""')}"`,
        `"${(log.user?.email || '').replace(/"/g, '""')}"`,
        `"${(log.action || '').replace(/"/g, '""')}"`,
        log.category,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        log.level
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Log the export action
    await logSystemEvent(
      "Logs Exported",
      `Admin ${session.user.id} exported logs in CSV format`,
      "INFO",
      { admin: session.user.email, format: 'csv', count: logs.length }
    );
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=logs-export-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    console.error("Error exporting logs:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
