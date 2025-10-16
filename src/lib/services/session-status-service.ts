/**
 * Utility functions for managing session status transitions
 */

import { convertMongoDate } from "@/lib/utils/datetime-utils";
import type { DateValue } from "@/lib/types/utils";

export interface SessionStatusUpdate {
  sessionId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
  reason: string;
  isDelayed?: boolean;
}

interface SessionData {
  _id: string; // MongoDB uses _id
  id?: string; // Prisma uses id (optional for compatibility)
  timeSlotId: string;
  status: string;
  isDelayed?: boolean;
  manualStartTime?: DateValue;
  actualEndTime?: DateValue;
  scheduledTime?: DateValue;
  scheduledAt?: DateValue;
  duration?: number;
  [key: string]: unknown;
}

// Helper function to get session ID from either _id or id field
function getSessionId(session: SessionData): string {
  return session.id || session._id;
}

/**
 * Automatically update session statuses based on time
 */
export async function updateSessionStatuses(): Promise<SessionStatusUpdate[]> {
  const updates: SessionStatusUpdate[] = [];
  const currentTime = new Date();

  try {
    const { prisma } = await import("@/lib/config/prisma");

    // 1. Complete ongoing sessions from SCHEDULE collection (subscription sessions)
    // Auto-complete when: scheduledTime + duration <= currentTime OR manualStartTime + duration <= currentTime
    const scheduleSessionsResult = await prisma.$runCommandRaw({
      find: "schedule",
      filter: {
        status: "ONGOING",
      },
    });

    let scheduleSessions: SessionData[] = [];
    if (
      scheduleSessionsResult &&
      typeof scheduleSessionsResult === "object" &&
      "cursor" in scheduleSessionsResult &&
      scheduleSessionsResult.cursor &&
      typeof scheduleSessionsResult.cursor === "object" &&
      "firstBatch" in scheduleSessionsResult.cursor &&
      Array.isArray(scheduleSessionsResult.cursor.firstBatch)
    ) {
      scheduleSessions = scheduleSessionsResult.cursor.firstBatch as SessionData[];
    }

    for (const session of scheduleSessions) {
      const durationMinutes = session.duration || 60;
      let expectedEndTime: Date | null = null;
      let completionReason = "";

      // Check if session was manually started
      const manualStartTime = convertMongoDate(session.manualStartTime);
      if (manualStartTime) {
        // Use manual start time + duration
        expectedEndTime = new Date(manualStartTime.getTime() + durationMinutes * 60 * 1000);
        completionReason = `Manually started session auto-completed after ${durationMinutes} minutes (started: ${manualStartTime.toISOString()})`;
      } else {
        // Use scheduled time + duration
        const scheduledTime = convertMongoDate(session.scheduledTime || session.scheduledAt);
        if (scheduledTime) {
          expectedEndTime = new Date(scheduledTime.getTime() + durationMinutes * 60 * 1000);
          completionReason = `Auto-started session auto-completed after ${durationMinutes} minutes (scheduled: ${scheduledTime.toISOString()})`;
        }
      }

      // Auto-complete if we've passed the expected end time
      if (expectedEndTime && expectedEndTime <= currentTime) {
        await prisma.schedule.update({
          where: { id: getSessionId(session) },
          data: {
            status: "COMPLETED",
            updatedAt: new Date(),
          },
        });

        updates.push({
          sessionId: getSessionId(session),
          oldStatus: "ONGOING",
          newStatus: "COMPLETED",
          timestamp: currentTime,
          reason: completionReason,
        });
      }
    }

    // 2. Complete ongoing sessions from SESSIONBOOKING collection (individual sessions)
    // Auto-complete when: scheduledAt + duration <= currentTime OR manualStartTime + duration <= currentTime
    const sessionBookingResult = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: {
        status: "ONGOING",
      },
    });

    let sessionBookings: SessionData[] = [];
    if (
      sessionBookingResult &&
      typeof sessionBookingResult === "object" &&
      "cursor" in sessionBookingResult &&
      sessionBookingResult.cursor &&
      typeof sessionBookingResult.cursor === "object" &&
      "firstBatch" in sessionBookingResult.cursor &&
      Array.isArray(sessionBookingResult.cursor.firstBatch)
    ) {
      sessionBookings = sessionBookingResult.cursor.firstBatch as SessionData[];
    }

    for (const session of sessionBookings) {
      const sessionId = getSessionId(session);
      const durationMinutes = session.duration || 60;
      let expectedEndTime: Date | null = null;
      let completionReason = "";

      // Check if session was manually started
      const manualStartTime = convertMongoDate(session.manualStartTime);
      if (manualStartTime) {
        // Use manual start time + duration
        expectedEndTime = new Date(manualStartTime.getTime() + durationMinutes * 60 * 1000);
        completionReason = `Manually started session auto-completed after ${durationMinutes} minutes (started: ${manualStartTime.toISOString()})`;
      } else {
        // Use scheduled time + duration
        const scheduledTime = convertMongoDate(session.scheduledAt);
        if (scheduledTime) {
          expectedEndTime = new Date(scheduledTime.getTime() + durationMinutes * 60 * 1000);
          completionReason = `Auto-started session auto-completed after ${durationMinutes} minutes (scheduled: ${scheduledTime.toISOString()})`;
        }
      }

      // Auto-complete if we've passed the expected end time
      if (expectedEndTime && expectedEndTime <= currentTime) {
        await prisma.sessionBooking.update({
          where: { id: sessionId },
          data: {
            status: "COMPLETED",
            updatedAt: new Date(),
          },
        });

        updates.push({
          sessionId: sessionId,
          oldStatus: "ONGOING",
          newStatus: "COMPLETED",
          timestamp: currentTime,
          reason: completionReason,
        });
      }
    }

    // All updates processed
  } catch (error) {
    console.error("Error updating session statuses:", error);
    throw error;
  }

  return updates;
}
