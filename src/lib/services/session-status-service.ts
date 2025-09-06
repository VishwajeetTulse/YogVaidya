/**
 * Utility functions for managing session status transitions
 */

export interface SessionStatusUpdate {
  sessionId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
  reason: string;
  isDelayed?: boolean;
}

interface SessionData {
  id: string;
  timeSlotId: string;
  status: string;
  isDelayed?: boolean;
  [key: string]: any;
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
        const startTime = new Date(timeSlot.startTime);

        // Check if session should be marked as delayed (past start time but not manually started)
        if (startTime <= currentTime) {
          await prisma.$runCommandRaw({
            update: 'sessionBooking',
            updates: [{
              q: { _id: session.id },
              u: { 
                $set: { 
                  status: 'ONGOING',
                  isDelayed: true,
                  updatedAt: currentTime
                } 
              }
            }]
          });

          updates.push({
            sessionId: session.id,
            oldStatus: 'SCHEDULED',
            newStatus: 'ONGOING',
            timestamp: currentTime,
            reason: `Session marked as delayed - started late at ${currentTime.toISOString()}`,
            isDelayed: true
          });
        }
      }
    }

    // 2. Complete ongoing sessions that have ended (only non-delayed ones complete automatically)
    const ongoingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        timeSlotId: { $ne: null },
        isDelayed: { $ne: true } // Only complete sessions that aren't delayed
      }
    });

    let ongoingSessions: SessionData[] = [];
    if (ongoingSessionsResult && 
        typeof ongoingSessionsResult === 'object' && 
        'cursor' in ongoingSessionsResult &&
        ongoingSessionsResult.cursor &&
        typeof ongoingSessionsResult.cursor === 'object' &&
        'firstBatch' in ongoingSessionsResult.cursor &&
        Array.isArray(ongoingSessionsResult.cursor.firstBatch)) {
      ongoingSessions = ongoingSessionsResult.cursor.firstBatch as SessionData[];
    }

    for (const session of ongoingSessions) {
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
        const endTime = new Date(timeSlot.endTime);

        // Check if session should be completed (only non-delayed sessions)
        if (endTime <= currentTime) {
          await prisma.$runCommandRaw({
            update: 'sessionBooking',
            updates: [{
              q: { _id: session.id },
              u: { 
                $set: { 
                  status: 'COMPLETED',
                  updatedAt: currentTime
                } 
              }
            }]
          });

          updates.push({
            sessionId: session.id,
            oldStatus: 'ONGOING',
            newStatus: 'COMPLETED',
            timestamp: currentTime,
            reason: `Session ended at ${endTime.toISOString()}`
          });
        }
      }
    }

  } catch (error) {
    console.error('Error updating session statuses:', error);
    throw error;
  }

  return updates;
}
