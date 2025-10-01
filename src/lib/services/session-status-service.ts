/**
 * Utility functions for managing session status transitions
 */

import { convertMongoDate } from "@/lib/utils/datetime-utils";
import { createDateUpdate } from "@/lib/utils/date-utils";

export interface SessionStatusUpdate {
  sessionId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
  reason: string;
  isDelayed?: boolean;
}

interface SessionData {
  _id: string;  // MongoDB uses _id
  id?: string;  // Prisma uses id (optional for compatibility)
  timeSlotId: string;
  status: string;
  isDelayed?: boolean;
  manualStartTime?: string | Date;
  actualEndTime?: string | Date;
  [key: string]: any;
}

// Helper function to get session ID from either _id or id field
function getSessionId(session: SessionData): string {
  return session.id || session._id;
}

interface TimeSlotData {
  _id: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

/**
 * Automatically update session statuses based on time
 */
export async function updateSessionStatuses(): Promise<SessionStatusUpdate[]> {
  const updates: SessionStatusUpdate[] = [];
  const currentTime = new Date();

  try {
    const { prisma } = await import("@/lib/config/prisma");

    // 1. Handle scheduled sessions that should be marked as delayed
    const scheduledSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'SCHEDULED',
        timeSlotId: { $ne: null }
      }
    });

    let scheduledSessions: SessionData[] = [];
    if (scheduledSessionsResult && 
        typeof scheduledSessionsResult === 'object' && 
        'cursor' in scheduledSessionsResult &&
        scheduledSessionsResult.cursor &&
        typeof scheduledSessionsResult.cursor === 'object' &&
        'firstBatch' in scheduledSessionsResult.cursor &&
        Array.isArray(scheduledSessionsResult.cursor.firstBatch)) {
      scheduledSessions = scheduledSessionsResult.cursor.firstBatch as SessionData[];
    }

    for (const session of scheduledSessions) {
      if (!session.timeSlotId) continue;
      
      // Get time slot details
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      let timeSlot: TimeSlotData | null = null;
      if (timeSlotResult && 
          typeof timeSlotResult === 'object' && 
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0] as TimeSlotData;
      }

      if (timeSlot) {
        const startTime = convertMongoDate(timeSlot.startTime);

        // Check if session should be marked as delayed (past start time but not manually started)
        // NOTE: Sessions will remain SCHEDULED until mentor manually starts them
        if (startTime && startTime <= currentTime) {
          // Only mark as delayed if not already marked, but keep status as SCHEDULED
          if (!session.isDelayed) {
            // Use Prisma client to avoid string date conversion
            await prisma.sessionBooking.update({
              where: { id: getSessionId(session) },
              data: {
                isDelayed: true, // Mark as delayed for UI indication
                updatedAt: new Date() // Ensure proper Date object
              }
            });

            updates.push({
              sessionId: getSessionId(session),
              oldStatus: 'SCHEDULED',
              newStatus: 'SCHEDULED', // Keep as SCHEDULED until mentor starts
              timestamp: currentTime,
              reason: `Session marked as delayed - waiting for mentor to start at ${currentTime.toISOString()}`,
              isDelayed: true
            });
          }
        }
      }
    }

    // 2. Complete ongoing sessions based on their type (on-time vs delayed)
    // 2a. Complete on-time sessions at their planned end time
    const onTimeOngoingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        timeSlotId: { $ne: null },
        isDelayed: { $ne: true }, // Only on-time sessions
        manualStartTime: { $exists: false } // Started automatically/on-time
      }
    });

    let onTimeOngoingSessions: SessionData[] = [];
    if (onTimeOngoingSessionsResult &&
        typeof onTimeOngoingSessionsResult === 'object' &&
        'cursor' in onTimeOngoingSessionsResult &&
        onTimeOngoingSessionsResult.cursor &&
        typeof onTimeOngoingSessionsResult.cursor === 'object' &&
        'firstBatch' in onTimeOngoingSessionsResult.cursor &&
        Array.isArray(onTimeOngoingSessionsResult.cursor.firstBatch)) {
      onTimeOngoingSessions = onTimeOngoingSessionsResult.cursor.firstBatch as SessionData[];
    }

    for (const session of onTimeOngoingSessions) {
      if (!session.timeSlotId) continue;

      // Get time slot details to find planned end time
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      let timeSlot: TimeSlotData | null = null;
      if (timeSlotResult &&
          typeof timeSlotResult === 'object' &&
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0] as TimeSlotData;
      }

      if (timeSlot) {
        const plannedEndTime = convertMongoDate(timeSlot.endTime);

        // Complete on-time session at planned end time
        if (plannedEndTime && plannedEndTime <= currentTime) {
          // Use Prisma client to avoid string date conversion
          await prisma.sessionBooking.update({
            where: { id: getSessionId(session) },
            data: {
              status: 'COMPLETED',
              actualEndTime: new Date(), // Ensure this is a proper Date object
              completionReason: 'Auto-completed at planned end time',
              updatedAt: new Date() // Ensure proper Date object
            }
          });

          updates.push({
            sessionId: getSessionId(session),
            oldStatus: 'ONGOING',
            newStatus: 'COMPLETED',
            timestamp: currentTime,
            reason: `On-time session auto-completed at planned end time ${plannedEndTime.toISOString()}`
          });
        }
      }
    }

    // 2b. Complete delayed sessions based on their manual start time + planned duration
    const delayedOngoingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        timeSlotId: { $ne: null },
        isDelayed: true, // Only delayed sessions
        manualStartTime: { $exists: true, $ne: null } // Must have been manually started
      }
    });

    let delayedOngoingSessions: SessionData[] = [];
    if (delayedOngoingSessionsResult &&
        typeof delayedOngoingSessionsResult === 'object' &&
        'cursor' in delayedOngoingSessionsResult &&
        delayedOngoingSessionsResult.cursor &&
        typeof delayedOngoingSessionsResult.cursor === 'object' &&
        'firstBatch' in delayedOngoingSessionsResult.cursor &&
        Array.isArray(delayedOngoingSessionsResult.cursor.firstBatch)) {
      delayedOngoingSessions = delayedOngoingSessionsResult.cursor.firstBatch as SessionData[];
    }

    for (const session of delayedOngoingSessions) {
      if (!session.manualStartTime || !session.timeSlotId) continue;

      const actualStartTime = convertMongoDate(session.manualStartTime);
      let sessionDurationMs = 0;

      if (!actualStartTime) continue;

      // Get time slot details to calculate planned duration
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      let timeSlot: TimeSlotData | null = null;
      if (timeSlotResult &&
          typeof timeSlotResult === 'object' &&
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0] as TimeSlotData;
      }

      if (timeSlot) {
        const originalStartTime = convertMongoDate(timeSlot.startTime);
        const originalEndTime = convertMongoDate(timeSlot.endTime);

        if (originalStartTime && originalEndTime) {
          sessionDurationMs = originalEndTime.getTime() - originalStartTime.getTime();
        }
      }

      // If no time slot duration found, use defaults based on session type
      if (sessionDurationMs === 0) {
        let durationMinutes = 60; // Default 60 minutes

        // Set duration based on session type
        if (session.sessionType === 'YOGA') {
          durationMinutes = 60; // 1 hour for yoga
        } else if (session.sessionType === 'MEDITATION') {
          durationMinutes = 30; // 30 minutes for meditation
        } else if (session.sessionType === 'DIET') {
          durationMinutes = 45; // 45 minutes for diet consultation
        }

        sessionDurationMs = durationMinutes * 60 * 1000;
      }

      // Calculate when this delayed session should end: manualStartTime + plannedDuration
      const calculatedEndTime = new Date(actualStartTime.getTime() + sessionDurationMs);

      // Check if the calculated end time has passed
      if (calculatedEndTime <= currentTime) {
        // Use Prisma client to avoid string date conversion
        await prisma.sessionBooking.update({
          where: { id: getSessionId(session) },
          data: {
            status: 'COMPLETED',
            actualEndTime: new Date(), // Ensure this is a proper Date object
            completionReason: `Auto-completed after planned duration from manual start`,
            updatedAt: new Date() // Ensure proper Date object
          }
        });

        updates.push({
          sessionId: getSessionId(session),
          oldStatus: 'ONGOING',
          newStatus: 'COMPLETED',
          timestamp: currentTime,
          reason: `Delayed session auto-completed - manually started at ${actualStartTime.toISOString()}, planned duration ${Math.round(sessionDurationMs/60000)} minutes, calculated end time ${calculatedEndTime.toISOString()}`
        });
      }
    }

    // 2c. Handle inconsistent sessions: ONGOING + delayed but no manual start time
    // These sessions shouldn't exist but we need to clean them up
    const inconsistentSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        timeSlotId: { $ne: null },
        isDelayed: true, // Marked as delayed
        $or: [
          { manualStartTime: { $exists: false } }, // No manual start time field
          { manualStartTime: null } // Null manual start time
        ]
      }
    });

    let inconsistentSessions: SessionData[] = [];
    if (inconsistentSessionsResult &&
        typeof inconsistentSessionsResult === 'object' &&
        'cursor' in inconsistentSessionsResult &&
        inconsistentSessionsResult.cursor &&
        typeof inconsistentSessionsResult.cursor === 'object' &&
        'firstBatch' in inconsistentSessionsResult.cursor &&
        Array.isArray(inconsistentSessionsResult.cursor.firstBatch)) {
      inconsistentSessions = inconsistentSessionsResult.cursor.firstBatch as SessionData[];
    }

    for (const session of inconsistentSessions) {
      if (!session.timeSlotId) continue;

      // Get the time slot to determine planned end time
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      let timeSlot: TimeSlotData | null = null;
      if (timeSlotResult &&
          typeof timeSlotResult === 'object' &&
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0] as TimeSlotData;
      }

      if (timeSlot) {
        const plannedEndTime = convertMongoDate(timeSlot.endTime);

        // Complete inconsistent session if past planned end time
        if (plannedEndTime && plannedEndTime <= currentTime) {
          // Use Prisma client to avoid string date conversion
          await prisma.sessionBooking.update({
            where: { id: getSessionId(session) },
            data: {
              status: 'COMPLETED',
              actualEndTime: new Date(), // Ensure this is a proper Date object
              completionReason: 'Auto-completed - inconsistent session state (delayed but no manual start)',
              updatedAt: new Date() // Ensure proper Date object
            }
          });

          updates.push({
            sessionId: getSessionId(session),
            oldStatus: 'ONGOING',
            newStatus: 'COMPLETED',
            timestamp: currentTime,
            reason: `Inconsistent session auto-completed - was marked delayed but never manually started, completed at planned end time ${plannedEndTime.toISOString()}`
          });
        }
      }
    }

    // NOTE: The logic above now handles all session types:
    // 1. On-time sessions (completed at planned end time)
    // 2. Delayed sessions with manual start (completed after planned duration from manual start)
    // 3. Inconsistent sessions (delayed but no manual start - completed at planned end time)

  } catch (error) {
    console.error('Error updating session statuses:', error);
    throw error;
  }

  return updates;
}
