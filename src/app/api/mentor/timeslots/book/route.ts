import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";
import type { SessionBookingDocument } from "@/lib/types/sessions";
import type { MongoCommandResult } from "@/lib/types/mongodb";
import type { Prisma } from "@prisma/client";

import { AuthenticationError, ConflictError, NotFoundError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

// Interface for timeSlot properties from MongoDB
interface TimeSlotData {
  _id?: string;
  mentorId?: string;
  sessionType?: string;
  price?: number;
  currentStudents?: number;
  maxStudents?: number;
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const bookTimeSlotSchema = z.object({
  timeSlotId: z.string().min(1, "Time slot ID is required"),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();
    const { timeSlotId, notes: _notes } = bookTimeSlotSchema.parse(body);

    const { prisma } = await import("@/lib/config/prisma");

    // Get the time slot details
    const timeSlotResult = await prisma.$runCommandRaw({
      find: "mentorTimeSlot",
      filter: { _id: timeSlotId, isActive: true },
    });

    let timeSlot: Prisma.JsonObject | null = null;
    if (
      timeSlotResult &&
      typeof timeSlotResult === "object" &&
      "cursor" in timeSlotResult &&
      timeSlotResult.cursor &&
      typeof timeSlotResult.cursor === "object" &&
      "firstBatch" in timeSlotResult.cursor &&
      Array.isArray(timeSlotResult.cursor.firstBatch)
    ) {
      timeSlot = timeSlotResult.cursor.firstBatch[0] as Prisma.JsonObject;
    }

    if (!timeSlot) {
      throw new NotFoundError("Time slot not found");
    }

    // Cast to our interface for property access
    const slot = timeSlot as unknown as TimeSlotData;

    // Check if slot is already booked or at capacity
    if ((slot.currentStudents || 0) >= (slot.maxStudents || 1)) {
      throw new ConflictError("Time slot is fully booked");
    }

    // Check if user already has an active session with this mentor
    const existingSessionsResult = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: {
        userId: session.user.id,
        mentorId: slot.mentorId,
        status: { $in: ["PENDING", "CONFIRMED"] },
        paymentStatus: "COMPLETED",
      },
    });

    let existingSessions: SessionBookingDocument[] = [];
    if (
      existingSessionsResult &&
      typeof existingSessionsResult === "object" &&
      "cursor" in existingSessionsResult &&
      existingSessionsResult.cursor &&
      typeof existingSessionsResult.cursor === "object" &&
      "firstBatch" in existingSessionsResult.cursor &&
      Array.isArray(existingSessionsResult.cursor.firstBatch)
    ) {
      existingSessions = (
        existingSessionsResult as unknown as MongoCommandResult<SessionBookingDocument>
      ).cursor!.firstBatch;
    }

    if (existingSessions.length > 0) {
      throw new ConflictError("You already have an active session with this mentor");
    }

    // Get mentor details
    const mentor = await prisma.user.findFirst({
      where: {
        id: slot.mentorId,
        role: "MENTOR",
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
      throw new NotFoundError("Mentor not found");
    }

    // Create Razorpay order
    const amount = (slot.price || mentor.sessionPrice || 500) as number; // Use slot price or mentor default
    const _orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const receipt = `ts_${Date.now()}`.substring(0, 13); // Limit to 13 characters

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        userId: session.user.id,
        timeSlotId: timeSlotId,
        mentorId: slot.mentorId as string,
        sessionType: slot.sessionType as string,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: amount,
        currency: "INR",
        timeSlot: {
          id: timeSlot._id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType,
          price: amount,
        },
        mentor: {
          name: mentor.name,
          mentorType: mentor.mentorType,
        },
      },
    });
  } catch (error) {
    console.error("Error booking time slot:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to book time slot" },
      { status: 500 }
    );
  }
}
