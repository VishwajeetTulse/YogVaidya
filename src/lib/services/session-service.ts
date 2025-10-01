/**
 * Robust Session Service
 * Handles session lookups, updates, and operations across all collections
 * Supports both string IDs and ObjectIds, and handles different collection types
 */

import { prisma } from "@/lib/config/prisma";
import { createDateUpdate } from "@/lib/utils/date-utils";

export interface SessionLookupResult {
  found: boolean;
  session: any | null;
  collection: 'sessionBooking' | 'schedule' | null;
  error?: string;
}

export interface SessionUpdateResult {
  success: boolean;
  updatedCount: number;
  error?: string;
}

export class SessionService {
  /**
   * Find a session by ID across all collections
   */
  static async findSession(sessionId: string): Promise<SessionLookupResult> {
    try {
      console.log(`🔍 Looking for session: ${sessionId}`);

      // 1. Try sessionBooking collection first
      const sessionBookingResult = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: { _id: sessionId }
      });

      if (this.isValidResult(sessionBookingResult)) {
        const session = (sessionBookingResult as any).cursor.firstBatch[0];
        console.log(`✅ Found session in sessionBooking collection: ${session._id}`);
        return {
          found: true,
          session,
          collection: 'sessionBooking'
        };
      }

      // 2. Try schedule collection
      const scheduleResult = await prisma.$runCommandRaw({
        find: 'schedule',
        filter: { _id: sessionId }
      });

      if (this.isValidResult(scheduleResult)) {
        const session = (scheduleResult as any).cursor.firstBatch[0];
        console.log(`✅ Found session in schedule collection: ${session._id}`);
        return {
          found: true,
          session,
          collection: 'schedule'
        };
      }

      // 3. Try ObjectId conversion if the ID looks like it could be converted
      if (this.isValidObjectId(sessionId)) {
        try {
          const { ObjectId } = require('mongodb');

          // Try ObjectId in sessionBooking
          const objectIdSessionBooking = await prisma.$runCommandRaw({
            find: 'sessionBooking',
            filter: { _id: new ObjectId(sessionId) }
          });

          if (this.isValidResult(objectIdSessionBooking)) {
            const session = (objectIdSessionBooking as any).cursor.firstBatch[0];
            console.log(`✅ Found session in sessionBooking collection (ObjectId): ${session._id}`);
            return {
              found: true,
              session,
              collection: 'sessionBooking'
            };
          }

          // Try ObjectId in schedule
          const objectIdSchedule = await prisma.$runCommandRaw({
            find: 'schedule',
            filter: { _id: new ObjectId(sessionId) }
          });

          if (this.isValidResult(objectIdSchedule)) {
            const session = (objectIdSchedule as any).cursor.firstBatch[0];
            console.log(`✅ Found session in schedule collection (ObjectId): ${session._id}`);
            return {
              found: true,
              session,
              collection: 'schedule'
            };
          }
        } catch (objectIdError) {
          console.log(`⚠️ ObjectId conversion failed: ${objectIdError}`);
        }
      }

      console.log(`❌ Session not found: ${sessionId}`);
      return {
        found: false,
        session: null,
        collection: null,
        error: 'Session not found in any collection'
      };

    } catch (error) {
      console.error(`❌ Error finding session ${sessionId}:`, error);
      return {
        found: false,
        session: null,
        collection: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a session's status
   */
  static async updateSessionStatus(
    sessionId: string,
    newStatus: string,
    additionalUpdates: Record<string, any> = {}
  ): Promise<SessionUpdateResult> {
    try {
      console.log(`🔄 Updating session ${sessionId} to status: ${newStatus}`);

      // First find the session
      const lookupResult = await this.findSession(sessionId);

      if (!lookupResult.found || !lookupResult.collection) {
        return {
          success: false,
          updatedCount: 0,
          error: lookupResult.error || 'Session not found'
        };
      }

      // Prepare update data with proper Date objects
      const updateData: any = {
        $set: createDateUpdate({
          status: newStatus,
          ...additionalUpdates
        })
      };

      // Update the session
      const updateResult = await prisma.$runCommandRaw({
        update: lookupResult.collection,
        updates: [{
          q: { _id: sessionId },
          u: updateData
        }]
      });

      const updatedCount = (updateResult as any)?.nModified || 0;
      console.log(`✅ Updated ${updatedCount} session(s) in ${lookupResult.collection}`);

      // If this is a schedule entry, also update related session bookings
      if (lookupResult.collection === 'schedule') {
        // Use Prisma client operations to avoid string date conversion
        try {
          const relatedBookingsUpdate = await prisma.sessionBooking.updateMany({
            where: { timeSlotId: sessionId },
            data: {
              status: status as any, // Type cast to handle ScheduleStatus enum
              updatedAt: new Date() // Ensure proper Date object
            }
          });

          console.log(`✅ Updated ${relatedBookingsUpdate.count} related session booking(s)`);
        } catch (error) {
          console.log('⚠️ Could not update related bookings (non-critical):', (error as Error).message);
        }
      }

      return {
        success: true,
        updatedCount: updatedCount
      };

    } catch (error) {
      console.error(`❌ Error updating session ${sessionId}:`, error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Start a session (mark as ONGOING)
   */
  static async startSession(sessionId: string): Promise<SessionUpdateResult> {
    return this.updateSessionStatus(sessionId, 'ONGOING', {
      isDelayed: false,
      manualStartTime: new Date()
    });
  }

  /**
   * Complete a session (mark as COMPLETED)
   */
  static async completeSession(sessionId: string): Promise<SessionUpdateResult> {
    return this.updateSessionStatus(sessionId, 'COMPLETED', {
      actualEndTime: new Date(),
      completionReason: 'Manually completed'
    });
  }

  /**
   * Check if a MongoDB result is valid
   */
  private static isValidResult(result: any): boolean {
    return result &&
           typeof result === 'object' &&
           'cursor' in result &&
           result.cursor &&
           typeof result.cursor === 'object' &&
           'firstBatch' in result.cursor &&
           Array.isArray(result.cursor.firstBatch) &&
           result.cursor.firstBatch.length > 0;
  }

  /**
   * Check if a string could be a valid MongoDB ObjectId
   */
  private static isValidObjectId(id: string): boolean {
    // MongoDB ObjectIds are 24-character hex strings
    return /^[a-fA-F0-9]{24}$/.test(id);
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    totalSessions: number;
    scheduledSessions: number;
    ongoingSessions: number;
    completedSessions: number;
    scheduleEntries: number;
  }> {
    try {
      // Count session bookings
      const sessionBookingStats = await prisma.$runCommandRaw({
        aggregate: 'sessionBooking',
        pipeline: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]
      });

      // Count schedule entries
      const scheduleStats = await prisma.$runCommandRaw({
        count: 'schedule'
      });

      const stats = {
        totalSessions: 0,
        scheduledSessions: 0,
        ongoingSessions: 0,
        completedSessions: 0,
        scheduleEntries: Number((scheduleStats as any)?.n) || 0
      };

      if (this.isValidResult(sessionBookingStats)) {
        (sessionBookingStats as any).cursor.firstBatch.forEach((stat: any) => {
          stats.totalSessions += stat.count;
          switch (stat._id) {
            case 'SCHEDULED':
              stats.scheduledSessions = stat.count;
              break;
            case 'ONGOING':
              stats.ongoingSessions = stat.count;
              break;
            case 'COMPLETED':
              stats.completedSessions = stat.count;
              break;
          }
        });
      }

      return stats;

    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        scheduledSessions: 0,
        ongoingSessions: 0,
        completedSessions: 0,
        scheduleEntries: 0
      };
    }
  }
}