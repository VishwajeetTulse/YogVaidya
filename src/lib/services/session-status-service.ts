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
  manualStartTime?: string | Date;
  actualEndTime?: string | Date;
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
        // NOTE: Sessions will remain SCHEDULED until mentor manually starts them
        if (startTime <= currentTime) {
          // Only mark as delayed if not already marked, but keep status as SCHEDULED
          if (!session.isDelayed) {
            await prisma.$runCommandRaw({
              update: 'sessionBooking',
              updates: [{
                q: { _id: session.id },
                u: {
                  $set: {
                    isDelayed: true, // Mark as delayed for UI indication
                    updatedAt: currentTime
                  }
                }
              }]
            });

            updates.push({
              sessionId: session.id,
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

    // 2. Complete all ongoing sessions based on their actual start time + duration
    const ongoingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        manualStartTime: { $exists: true, $ne: null } // Only sessions that have been actually started
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
      if (!session.manualStartTime) continue;

      const actualStartTime = new Date(session.manualStartTime);
      let sessionDurationMs = 0;

      // First try to get duration from time slot
      if (session.timeSlotId) {
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
          const originalStartTime = new Date(timeSlot.startTime);
          const originalEndTime = new Date(timeSlot.endTime);
          sessionDurationMs = originalEndTime.getTime() - originalStartTime.getTime();
        }
      }

      // If no time slot duration found, use stored expected duration or defaults
      if (sessionDurationMs === 0) {
        let durationMinutes = session.expectedDuration || 60; // Default 60 minutes

        // Set duration based on session type if not stored
        if (!session.expectedDuration) {
          if (session.sessionType === 'YOGA') {
            durationMinutes = 60; // 1 hour for yoga
          } else if (session.sessionType === 'MEDITATION') {
            durationMinutes = 30; // 30 minutes for meditation
          } else if (session.sessionType === 'DIET') {
            durationMinutes = 45; // 45 minutes for diet consultation
          }
        }

        sessionDurationMs = durationMinutes * 60 * 1000;
      }

      // Calculate when this session should end: actualStartTime + sessionDuration
      const calculatedEndTime = new Date(actualStartTime.getTime() + sessionDurationMs);

      // Check if the calculated end time has passed
      if (calculatedEndTime <= currentTime) {
        await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session.id },
            u: {
              $set: {
                status: 'COMPLETED',
                actualEndTime: currentTime,
                completionReason: `Auto-completed after ${Math.round(sessionDurationMs/60000)} minutes duration`,
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
          reason: `Session auto-completed - started at ${actualStartTime.toISOString()}, duration ${Math.round(sessionDurationMs/60000)} minutes, ended at ${calculatedEndTime.toISOString()}`
        });
      }
    }

    // NOTE: The logic above now handles both on-time and delayed sessions uniformly
    // All sessions are completed based on their actual start time + intended duration

  } catch (error) {
    console.error('Error updating session statuses:', error);
    throw error;
  }

  return updates;
}
