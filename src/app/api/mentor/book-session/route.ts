import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";
import type { Prisma } from "@prisma/client";

import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

// Interface for timeSlot properties from MongoDB
interface TimeSlotData {
  _id?: string;
  mentorId?: string;
  sessionType?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  currentStudents?: number;
  maxStudents?: number;
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const bookSessionSchema = z.object({
  timeSlotId: z.string().min(1, "Time slot ID is required"),
  notes: z.string().optional(),
  // Keep backward compatibility
  mentorId: z.string().optional(),
  sessionDate: z.string().optional(),
  sessionTime: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();

    const { timeSlotId, notes, mentorId, sessionDate, sessionTime } = bookSessionSchema.parse(body);

    const { prisma } = await import("@/lib/config/prisma");

    // NEW APPROACH: Time Slot Based Booking
    if (timeSlotId) {
      // Get the time slot details and check availability
      const timeSlotResult = await prisma.$runCommandRaw({
        find: "mentorTimeSlot",
        filter: {
          _id: timeSlotId,
          isActive: true,
          $expr: { $lt: ["$currentStudents", "$maxStudents"] }, // Check if there's space available
        },
      });

      let timeSlot: Prisma.JsonObject | null = null;
      if (
        timeSlotResult &&
        typeof timeSlotResult === "object" &&
        "cursor" in timeSlotResult &&
        timeSlotResult.cursor &&
        typeof timeSlotResult.cursor === "object" &&
        "firstBatch" in timeSlotResult.cursor &&
        Array.isArray(timeSlotResult.cursor.firstBatch) &&
        timeSlotResult.cursor.firstBatch.length > 0
      ) {
        timeSlot = timeSlotResult.cursor.firstBatch[0] as Prisma.JsonObject;
      }

      if (!timeSlot) {
        throw new NotFoundError("Time slot not available or fully booked");
      }

      // Cast to TimeSlotData for property access
      const slot = timeSlot as unknown as TimeSlotData;

      // Double-check availability at application level
      if ((slot.currentStudents || 0) >= (slot.maxStudents || 1)) {
        throw new ConflictError("Time slot is fully booked");
      }

      // Get mentor details
      const mentor = await prisma.user.findFirst({
        where: {
          id: slot.mentorId,
          role: "MENTOR",
          isAvailable: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          sessionPrice: true,
          mentorType: true,
        },
      });

      if (!mentor) {
        throw new NotFoundError("Mentor not available");
      }

      // Check if user already has an active session with this mentor
      const existingSession = await prisma.$runCommandRaw({
        find: "sessionBooking",
        filter: {
          userId: session.user.id,
          mentorId: timeSlot.mentorId,
          status: { $in: ["SCHEDULED", "ONGOING"] },
        },
      });

      const hasExistingSessions =
        existingSession &&
        typeof existingSession === "object" &&
        "cursor" in existingSession &&
        existingSession.cursor &&
        typeof existingSession.cursor === "object" &&
        "firstBatch" in existingSession.cursor &&
        Array.isArray(existingSession.cursor.firstBatch) &&
        existingSession.cursor.firstBatch.length > 0;

      if (hasExistingSessions) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You already have an active session with this mentor. Please complete your current session before booking a new one.",
          },
          { status: 409 }
        );
      }

      // Use time slot price or mentor default price
      const sessionPrice = slot.price || mentor.sessionPrice || 500;

      if (!sessionPrice || sessionPrice <= 0) {
        throw new ValidationError("Session pricing not set");
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: (sessionPrice * 100) as number, // Convert to paise
        currency: "INR",
        receipt: `slot_${Date.now().toString().slice(-8)}`,
        notes: {
          timeSlotId: slot._id as string,
          mentorId: slot.mentorId as string,
          studentId: session.user.id,
          startTime: slot.startTime as string,
          endTime: slot.endTime as string,
          sessionType: slot.sessionType as string,
          type: "timeslot_booking",
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          amount: sessionPrice,
          currency: "INR",
          timeSlot: {
            id: timeSlot._id,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            sessionType: timeSlot.sessionType,
            price: sessionPrice,
          },
          mentor: {
            id: mentor.id,
            name: mentor.name,
            mentorType: mentor.mentorType,
          },
          sessionDetails: {
            notes,
          },
        },
      });
    }

    // LEGACY APPROACH: Keep backward compatibility for old API calls
    else if (mentorId && sessionDate && sessionTime) {
      // Keep the existing logic for backward compatibility
      let mentor;
      try {
        const userExists = await prisma.user.findFirst({
          where: { id: mentorId },
          select: { id: true, role: true, isAvailable: true, name: true },
        });

        if (!userExists) {
          const application = await prisma.mentorApplication.findFirst({
            where: { id: mentorId, status: "approved" },
            select: { email: true, userId: true, name: true },
          });

          if (application) {
            const actualUser = await prisma.user.findFirst({
              where: {
                OR: [{ email: application.email }, { id: application.userId || "" }],
              },
              select: { id: true, role: true, isAvailable: true, name: true },
            });

            if (actualUser) {
              mentor = await prisma.user.findFirst({
                where: {
                  id: actualUser.id,
                  role: "MENTOR",
                  isAvailable: true,
                },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  sessionPrice: true,
                  mentorType: true,
                },
              });
            }
          }
        } else {
          const fullUser = await prisma.user.findFirst({
            where: {
              id: mentorId,
              role: "MENTOR",
            },
            select: {
              id: true,
              name: true,
              email: true,
              sessionPrice: true,
              mentorType: true,
              isAvailable: true,
            },
          });

          if (fullUser && fullUser.isAvailable === true) {
            mentor = fullUser;
          }
        }
      } catch (dbError) {
        console.error("💥 Database query failed:", dbError);
        return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
      }

      if (!mentor) {
        throw new NotFoundError("Mentor not found or unavailable");
      }

      // Check existing sessions
      const existingSession = await prisma.$runCommandRaw({
        find: "sessionBooking",
        filter: {
          userId: session.user.id,
          mentorId: mentorId,
          status: { $in: ["SCHEDULED", "ONGOING"] },
        },
      });

      const hasExistingSessions =
        existingSession &&
        typeof existingSession === "object" &&
        "cursor" in existingSession &&
        existingSession.cursor &&
        typeof existingSession.cursor === "object" &&
        "firstBatch" in existingSession.cursor &&
        Array.isArray(existingSession.cursor.firstBatch) &&
        existingSession.cursor.firstBatch.length > 0;

      if (hasExistingSessions) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You already have an active session with this mentor. Please complete your current session before booking a new one.",
          },
          { status: 409 }
        );
      }

      if (!mentor.sessionPrice || mentor.sessionPrice <= 0) {
        throw new ValidationError("Mentor pricing not set");
      }

      const order = await razorpay.orders.create({
        amount: mentor.sessionPrice * 100,
        currency: "INR",
        receipt: `sess_${Date.now().toString().slice(-8)}`,
        notes: {
          mentorId,
          studentId: session.user.id,
          sessionDate,
          sessionTime,
          type: "mentor_session",
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          amount: mentor.sessionPrice,
          currency: "INR",
          mentor: {
            id: mentor.id,
            name: mentor.name,
            mentorType: mentor.mentorType,
          },
          sessionDetails: {
            date: sessionDate,
            time: sessionTime,
            notes,
          },
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Either timeSlotId or mentorId with sessionDate and sessionTime is required",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("💥 Error creating session booking:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create session booking" },
      { status: 500 }
    );
  }
}
