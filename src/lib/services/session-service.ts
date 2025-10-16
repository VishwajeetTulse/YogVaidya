/**
 * Robust Session Service
 * Handles session lookups, updates, and operations across all collections
 * Supports both string IDs and ObjectIds, and handles different collection types
 */

import { ObjectId } from "mongodb";
import { prisma } from "@/lib/config/prisma";
import { createDateUpdate } from "@/lib/utils/date-utils";
import type { SessionBookingDocument, ScheduleDocument } from "@/lib/types/sessions";
import type { Prisma, ScheduleStatus } from "@prisma/client";

// Union type for sessions from either collection
type SessionDocument = SessionBookingDocument | ScheduleDocument;

export interface SessionLookupResult {
  found: boolean;
  session: SessionDocument | null;
  collection: "sessionBooking" | "schedule" | null;
  error?: string;
}

export interface SessionUpdateResult {
  success: boolean;
  updatedCount: number;
  error?: string;
}

interface SessionStatResult {
  _id: string;
  count: number;
}

interface MongoCommandResult {
  cursor: {
    firstBatch: SessionStatResult[];
  };
}

export class SessionService {
  /**
   * Find a session by ID across all collections
   */
  static async findSession(sessionId: string): Promise<SessionLookupResult> {
    try {

      // 1. Try sessionBooking collection first
      const sessionBookingResult = await prisma.$runCommandRaw({
        find: "sessionBooking",
        filter: { _id: sessionId },
      });

      if (this.isValidResult(sessionBookingResult)) {
        const session = (sessionBookingResult as { cursor: { firstBatch: Prisma.JsonObject[] } })
          .cursor.firstBatch[0] as unknown as SessionDocument;

        return {
          found: true,
          session,
          collection: "sessionBooking",
        };
      }

      // 2. Try schedule collection
      const scheduleResult = await prisma.$runCommandRaw({
        find: "schedule",
        filter: { _id: sessionId },
      });

      if (this.isValidResult(scheduleResult)) {
        const session = (scheduleResult as { cursor: { firstBatch: Prisma.JsonObject[] } }).cursor
          .firstBatch[0] as unknown as SessionDocument;

        return {
          found: true,
          session,
          collection: "schedule",
        };
      }

      // 3. Try ObjectId conversion if the ID looks like it could be converted
      if (this.isValidObjectId(sessionId)) {
        try {
          // Try ObjectId in sessionBooking
          const objectIdSessionBooking = await prisma.$runCommandRaw({
            find: "sessionBooking",
            filter: { _id: new ObjectId(sessionId) },
          });

          if (this.isValidResult(objectIdSessionBooking)) {
            const session = (
              objectIdSessionBooking as { cursor: { firstBatch: Prisma.JsonObject[] } }
            ).cursor.firstBatch[0] as unknown as SessionDocument;

            return {
              found: true,
              session,
              collection: "sessionBooking",
            };
          }

          // Try ObjectId in schedule
          const objectIdSchedule = await prisma.$runCommandRaw({
            find: "schedule",
            filter: { _id: new ObjectId(sessionId) },
          });

          if (this.isValidResult(objectIdSchedule)) {
            const session = (objectIdSchedule as { cursor: { firstBatch: Prisma.JsonObject[] } })
              .cursor.firstBatch[0] as unknown as SessionDocument;

            return {
              found: true,
              session,
              collection: "schedule",
            };
          }
        } catch {
          // ObjectId conversion failed, continue
        }
      }

      return {
        found: false,
        session: null,
        collection: null,
        error: "Session not found in any collection",
      };
    } catch (error) {
      console.error(`❌ Error finding session ${sessionId}:`, error);
      return {
        found: false,
        session: null,
        collection: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update a session's status
   */
  static async updateSessionStatus(
    sessionId: string,
    newStatus: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalUpdates: Record<string, any> = {}
  ): Promise<SessionUpdateResult> {
    try {

      // First find the session
      const lookupResult = await this.findSession(sessionId);

      if (!lookupResult.found || !lookupResult.collection) {
        return {
          success: false,
          updatedCount: 0,
          error: lookupResult.error || "Session not found",
        };
      }

      // Prepare update data with proper Date objects
      const updateData = {
        $set: createDateUpdate({
          status: newStatus,
          ...additionalUpdates,
        }),
      };

      // Update the session
      const updateResult = await prisma.$runCommandRaw({
        update: lookupResult.collection,
        updates: [
          {
            q: { _id: sessionId },
            u: updateData as Prisma.InputJsonValue,
          },
        ],
      });

      const updatedCount = (updateResult as { nModified?: number })?.nModified || 0;

      // If this is a schedule entry, also update related session bookings
      if (lookupResult.collection === "schedule") {
        // Use Prisma client operations to avoid string date conversion
        try {
          await prisma.sessionBooking.updateMany({
            where: { timeSlotId: sessionId },
            data: {
              status: status as unknown as ScheduleStatus,
              updatedAt: new Date(), // Ensure proper Date object
            },
          });
        } catch {
          // Related bookings update failed, continue
        }
      }

      return {
        success: true,
        updatedCount: updatedCount,
      };
    } catch (error) {
      console.error(`❌ Error updating session ${sessionId}:`, error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Start a session (mark as ONGOING)
   */
  static async startSession(sessionId: string): Promise<SessionUpdateResult> {
    return this.updateSessionStatus(sessionId, "ONGOING", {
      manualStartTime: new Date(),
    });
  }

  /**
   * Complete a session (mark as COMPLETED)
   */
  static async completeSession(sessionId: string): Promise<SessionUpdateResult> {

    return this.updateSessionStatus(sessionId, "COMPLETED", {});
  }

  /**
   * Check if a MongoDB result is valid
   */
  private static isValidResult(result: unknown): boolean {
    return (
      result !== null &&
      result !== undefined &&
      typeof result === "object" &&
      "cursor" in result &&
      result.cursor !== null &&
      result.cursor !== undefined &&
      typeof result.cursor === "object" &&
      "firstBatch" in result.cursor &&
      Array.isArray(result.cursor.firstBatch) &&
      result.cursor.firstBatch.length > 0
    );
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
        aggregate: "sessionBooking",
        pipeline: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
      });

      // Count schedule entries
      const scheduleStats = await prisma.$runCommandRaw({
        count: "schedule",
      });

      const stats = {
        totalSessions: 0,
        scheduledSessions: 0,
        ongoingSessions: 0,
        completedSessions: 0,
        scheduleEntries: Number((scheduleStats as { n?: number })?.n) || 0,
      };

      if (this.isValidResult(sessionBookingStats)) {
        (sessionBookingStats as unknown as MongoCommandResult).cursor.firstBatch.forEach((stat) => {
          stats.totalSessions += stat.count;
          switch (stat._id) {
            case "SCHEDULED":
              stats.scheduledSessions = stat.count;
              break;
            case "ONGOING":
              stats.ongoingSessions = stat.count;
              break;
            case "COMPLETED":
              stats.completedSessions = stat.count;
              break;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error("Error getting session stats:", error);
      return {
        totalSessions: 0,
        scheduledSessions: 0,
        ongoingSessions: 0,
        completedSessions: 0,
        scheduleEntries: 0,
      };
    }
  }
}
