"use server";

import { type ScheduleStatus } from "@prisma/client";
import { prisma } from "./config/prisma";
export async function UpdateSessionStatus(
  status: ScheduleStatus,
  sessionId: string
): Promise<{ success: boolean; source: "schedule" | "booking" }> {
  try {
    // Validate sessionId is not undefined or empty
    if (!sessionId || sessionId.trim() === "") {
      console.error(`Invalid sessionId provided: ${sessionId}`);
      throw new Error(`Invalid session ID: ${sessionId}`);
    }

    // First try to find and update in Schedule collection (legacy sessions)

    const scheduleSession = await prisma.schedule.findUnique({
      where: { id: sessionId },
    });

    if (scheduleSession) {
      // Use raw MongoDB operation to ensure proper date handling
      await prisma.$runCommandRaw({
        update: "schedule",
        updates: [
          {
            q: { _id: sessionId },
            u: {
              $set: {
                status: status,
                updatedAt: new Date(), // Ensure Date object, not string
              },
            },
          },
        ],
      });

      return { success: true, source: "schedule" };
    }

    // If not found in Schedule, try SessionBooking collection

    const sessionBooking = await prisma.sessionBooking
      .findUnique({
        where: { id: sessionId },
      })
      .catch(async (error) => {
        // If we get a type conversion error, it's likely due to string dates
        if (error.code === "P2023" && error.message.includes("Failed to convert")) {
          // Try to fix the date field for this specific record using raw query
          try {
            await prisma.$runCommandRaw({
              update: "sessionBooking",
              updates: [
                {
                  q: { _id: sessionId, scheduledAt: { $type: "string" } },
                  u: [
                    {
                      $set: {
                        scheduledAt: {
                          $dateFromString: {
                            dateString: "$scheduledAt",
                          },
                        },
                      },
                    },
                  ],
                  multi: false,
                },
              ],
            });

            // Also fix createdAt and updatedAt if they are strings
            await prisma.$runCommandRaw({
              update: "sessionBooking",
              updates: [
                {
                  q: { _id: sessionId, createdAt: { $type: "string" } },
                  u: [
                    {
                      $set: {
                        createdAt: {
                          $dateFromString: {
                            dateString: "$createdAt",
                          },
                        },
                      },
                    },
                  ],
                  multi: false,
                },
              ],
            });

            await prisma.$runCommandRaw({
              update: "sessionBooking",
              updates: [
                {
                  q: { _id: sessionId, updatedAt: { $type: "string" } },
                  u: [
                    {
                      $set: {
                        updatedAt: {
                          $dateFromString: {
                            dateString: "$updatedAt",
                          },
                        },
                      },
                    },
                  ],
                  multi: false,
                },
              ],
            });

            // Now retry the find operation
            return await prisma.sessionBooking.findUnique({
              where: { id: sessionId },
            });
          } catch (fixError) {
            console.error("Failed to fix date fields:", fixError);
            throw error; // Throw original error
          }
        }
        throw error; // Re-throw if it's not a date conversion error
      });

    if (sessionBooking) {
      // SessionBooking uses the same ScheduleStatus enum
      // Use raw MongoDB operation to ensure proper date handling
      await prisma.$runCommandRaw({
        update: "sessionBooking",
        updates: [
          {
            q: { _id: sessionId },
            u: {
              $set: {
                status: status,
                updatedAt: new Date(), // Ensure Date object, not string
              },
            },
          },
        ],
      });

      return { success: true, source: "booking" };
    }

    // If session not found in either collection
    console.error(
      `Session ${sessionId} not found in either Schedule or SessionBooking collections`
    );
    throw new Error(`Session ${sessionId} not found`);
  } catch (error) {
    console.error(`Error updating session ${sessionId} status:`, error);
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Invalid session ID")) {
        throw new Error(`Invalid session ID provided: ${sessionId}`);
      }
      if (error.message.includes("not found")) {
        throw new Error(`Session ${sessionId} not found in database`);
      }
    }
    throw error;
  }
}
