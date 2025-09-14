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

    // 2. Complete ongoing sessions that have ended
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
            reason: `Session ended at scheduled time ${endTime.toISOString()}`
          });
        }
      }
    }

    // 3. Complete delayed ongoing sessions based on their manual start time + planned duration
    const delayedOngoingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        timeSlotId: { $ne: null },
        isDelayed: true,
        manualStartTime: { $exists: true, $ne: null } // Only sessions that have been manually started
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
      if (!session.timeSlotId || !session.manualStartTime) continue;

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
        const originalStartTime = new Date(timeSlot.startTime);
        const originalEndTime = new Date(timeSlot.endTime);
        const manualStartTime = new Date(session.manualStartTime);

        // Calculate planned duration: originalEndTime - originalStartTime
        const plannedDurationMs = originalEndTime.getTime() - originalStartTime.getTime();

        // Calculate when this delayed session should end: manualStartTime + plannedDuration
        const calculatedEndTime = new Date(manualStartTime.getTime() + plannedDurationMs);

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
            reason: `Delayed session auto-completed - started manually at ${manualStartTime.toISOString()}, planned duration ${Math.round(plannedDurationMs/60000)} minutes, calculated end time ${calculatedEndTime.toISOString()}`
          });
        }
      } else {
        // Time slot not found - use default duration based on session type
        console.log(`⚠️ Time slot not found for session ${session.id}, using default duration`);

        const manualStartTime = new Date(session.manualStartTime);
        let defaultDurationMinutes = 60; // Default 60 minutes

        // Set duration based on session type
        if (session.sessionType === 'YOGA') {
          defaultDurationMinutes = 60; // 1 hour for yoga
        } else if (session.sessionType === 'MEDITATION') {
          defaultDurationMinutes = 30; // 30 minutes for meditation
        } else if (session.sessionType === 'DIET') {
          defaultDurationMinutes = 45; // 45 minutes for diet consultation
        }

        const defaultDurationMs = defaultDurationMinutes * 60 * 1000;
        const calculatedEndTime = new Date(manualStartTime.getTime() + defaultDurationMs);

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
                  completionReason: `Default duration for ${session.sessionType}: ${defaultDurationMinutes} minutes`,
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
            reason: `Delayed session auto-completed with default duration - started manually at ${manualStartTime.toISOString()}, default duration ${defaultDurationMinutes} minutes for ${session.sessionType}, calculated end time ${calculatedEndTime.toISOString()}`
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
