import { prisma } from "@/lib/config/prisma";

export enum TicketLogLevel {
  INFO = "INFO",
  WARNING = "WARNING", 
  ERROR = "ERROR"
}

export enum TicketAction {
  // Ticket CRUD operations
  CREATED = "TICKET_CREATED",
  UPDATED = "TICKET_UPDATED",
  DELETED = "TICKET_DELETED",
  
  // Status changes
  STATUS_CHANGED = "TICKET_STATUS_CHANGED",
  ASSIGNED = "TICKET_ASSIGNED",
  UNASSIGNED = "TICKET_UNASSIGNED",
  
  // User actions
  VIEWED = "TICKET_VIEWED",
  FILTERED = "TICKET_FILTERED",
  
  // Admin actions
  BULK_DELETED = "TICKETS_BULK_DELETED",
  FORCE_ASSIGNED = "TICKET_FORCE_ASSIGNED",
  
  // System actions
  AUTO_RESOLVED = "TICKET_AUTO_RESOLVED",
  ESCALATED = "TICKET_ESCALATED"
}

interface TicketLogData {
  ticketId?: string;
  ticketNumber?: string;
  userId: string;
  action: TicketAction;
  level: TicketLogLevel;
  details: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class TicketLogger {
  /**
   * Log a ticket-related action
   */
  static async log({
    ticketId,
    ticketNumber,
    userId,
    action,
    level = TicketLogLevel.INFO,
    details,
    metadata = {},
    ipAddress,
    userAgent
  }: TicketLogData) {
    try {
      // Enhanced metadata with ticket context
      const enhancedMetadata = {
        ...metadata,
        ticketId,
        ticketNumber,
        action,
        timestamp: new Date().toISOString(),
        ...(ticketId && { relatedTicket: ticketId })
      };

      await prisma.systemLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          action,
          category: "TICKET",
          level,
          details,
          metadata: enhancedMetadata,
          ipAddress,
          userAgent,
          timestamp: new Date()
        }
      });

      // Console log for development (can be removed in production)
      console.log(`[TICKET_LOG] ${level}: ${action} - ${details}`, {
        ticketId,
        ticketNumber,
        userId,
        metadata: enhancedMetadata
      });

    } catch (error) {
      // Fail silently to not disrupt ticket operations
      console.error("Failed to log ticket action:", error);
    }
  }

  /**
   * Log ticket creation
   */
  static async logTicketCreated(ticketId: string, ticketNumber: string, userId: string, ticketData: any, request?: Request) {
    await this.log({
      ticketId,
      ticketNumber,
      userId,
      action: TicketAction.CREATED,
      level: TicketLogLevel.INFO,
      details: `Ticket created: ${ticketData.title}`,
      metadata: {
        category: ticketData.category,
        priority: ticketData.priority,
        title: ticketData.title
      },
      ipAddress: this.getIpFromRequest(request),
      userAgent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log status changes
   */
  static async logStatusChange(
    ticketId: string, 
    ticketNumber: string, 
    userId: string, 
    oldStatus: string, 
    newStatus: string,
    request?: Request
  ) {
    await this.log({
      ticketId,
      ticketNumber,
      userId,
      action: TicketAction.STATUS_CHANGED,
      level: TicketLogLevel.INFO,
      details: `Status changed from ${oldStatus} to ${newStatus}`,
      metadata: {
        oldStatus,
        newStatus,
        statusTransition: `${oldStatus} → ${newStatus}`
      },
      ipAddress: this.getIpFromRequest(request),
      userAgent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log ticket assignment
   */
  static async logAssignment(
    ticketId: string,
    ticketNumber: string,
    adminUserId: string,
    assigneeId: string | null,
    assigneeName: string | null,
    request?: Request
  ) {
    const isUnassignment = !assigneeId;
    
    await this.log({
      ticketId,
      ticketNumber,
      userId: adminUserId,
      action: isUnassignment ? TicketAction.UNASSIGNED : TicketAction.ASSIGNED,
      level: TicketLogLevel.INFO,
      details: isUnassignment 
        ? `Ticket unassigned by admin`
        : `Ticket assigned to ${assigneeName || 'moderator'}`,
      metadata: {
        assignedToId: assigneeId,
        assignedToName: assigneeName,
        assignedBy: adminUserId,
        isUnassignment
      },
      ipAddress: this.getIpFromRequest(request),
      userAgent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log bulk operations
   */
  static async logBulkDelete(userId: string, count: number, criteria: string, request?: Request) {
    await this.log({
      userId,
      action: TicketAction.BULK_DELETED,
      level: TicketLogLevel.WARNING,
      details: `Bulk deleted ${count} tickets with criteria: ${criteria}`,
      metadata: {
        deletedCount: count,
        deletionCriteria: criteria,
        deletedBy: userId
      },
      ipAddress: this.getIpFromRequest(request),
      userAgent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log error scenarios
   */
  static async logError(
    userId: string,
    action: TicketAction,
    error: string,
    ticketId?: string,
    ticketNumber?: string,
    request?: Request
  ) {
    await this.log({
      ticketId,
      ticketNumber,
      userId,
      action,
      level: TicketLogLevel.ERROR,
      details: `Error during ${action}: ${error}`,
      metadata: {
        errorMessage: error,
        failedAction: action
      },
      ipAddress: this.getIpFromRequest(request),
      userAgent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Extract IP address from request
   */
  private static getIpFromRequest(request?: Request): string | undefined {
    if (!request) return undefined;
    
    // Try various headers that might contain the real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    return realIp || cfConnectingIp || undefined;
  }

  /**
   * Get ticket activity summary for admin dashboard
   */
  static async getTicketActivitySummary(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const timeframeMap = {
      day: 24 * 60 * 60 * 1000,      // 1 day
      week: 7 * 24 * 60 * 60 * 1000,  // 7 days
      month: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    const startTime = new Date(now.getTime() - timeframeMap[timeframe]);

    try {
      const logs = await prisma.systemLog.findMany({
        where: {
          category: "TICKET",
          timestamp: {
            gte: startTime
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Aggregate statistics
      const stats = {
        totalActions: logs.length,
        byAction: {} as Record<string, number>,
        byLevel: {} as Record<string, number>,
        byUser: {} as Record<string, { name: string; count: number; role: string }>,
        recentActivity: logs.slice(0, 10)
      };

      logs.forEach(log => {
        // Count by action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // Count by level
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        
        // Count by user
        if (log.user) {
          if (!stats.byUser[log.userId!]) {
            stats.byUser[log.userId!] = {
              name: log.user.name || 'Unknown User',
              count: 0,
              role: log.user.role
            };
          }
          stats.byUser[log.userId!].count++;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error fetching ticket activity summary:", error);
      return null;
    }
  }
}
