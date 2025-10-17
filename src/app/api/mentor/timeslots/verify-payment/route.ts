import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";
import type { Prisma, SessionType } from "@prisma/client";

import { AuthenticationError, NotFoundError, ValidationError } from "@/lib/utils/error-handler";
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

const verifyTimeSlotPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  timeSlotId: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, timeSlotId, notes } =
      verifyTimeSlotPaymentSchema.parse(body);

    // Verify payment signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      throw new ValidationError("Invalid payment signature");
    }

    const { prisma } = await import("@/lib/config/prisma");

    // Get the time slot details
    const timeSlotResult = await prisma.$runCommandRaw({
      find: "mentorTimeSlot",
      filter: { _id: timeSlotId },
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

    // Get mentor application for reference
    const mentorApplication = await prisma.mentorApplication.findFirst({
      where: {
        OR: [{ userId: slot.mentorId }, { email: mentor.email }],
        status: "approved",
      },
    });

    // Create session booking
    const sessionBookingData = {
      _id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      mentorId: slot.mentorId,
      mentorApplicationId: mentorApplication?.id || null,
      timeSlotId: timeSlotId,
      sessionType: slot.sessionType,
      scheduledAt: new Date(slot.startTime!),
      status: "CONFIRMED",
      notes: notes || "",
      amount: slot.price || mentor.sessionPrice || 500,
      paymentStatus: "COMPLETED",
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: slot.price || mentor.sessionPrice || 500,
        currency: "INR",
      },
      // Removed createdAt and updatedAt - let Prisma auto-generate these
    };

    // Import date utility for consistent date handling
    const { createDateUpdate } = await import("@/lib/utils/date-utils");

    // Calculate duration from timeSlot
    const sessionDuration = Math.round(
      (new Date(slot.endTime!).getTime() - new Date(slot.startTime!).getTime()) / (1000 * 60)
    );

    // Create the session booking using Prisma to ensure proper date handling
    const _sessionBooking = await prisma.sessionBooking.create({
      data: {
        id: sessionBookingData._id,
        userId: sessionBookingData.userId,
        mentorId: sessionBookingData.mentorId as string,
        mentorApplicationId: sessionBookingData.mentorApplicationId,
        timeSlotId: sessionBookingData.timeSlotId,
        sessionType: sessionBookingData.sessionType as SessionType,
        scheduledAt: sessionBookingData.scheduledAt,
        duration: sessionDuration,
        status: "SCHEDULED", // Use proper enum value
        notes: sessionBookingData.notes,
        paymentStatus: sessionBookingData.paymentStatus,
        amount: sessionBookingData.amount as number,
        paymentDetails: sessionBookingData.paymentDetails,
      },
    });

    // Update the time slot to mark as booked
    const updatedCurrentStudents = (slot.currentStudents || 0) + 1;
    const isNowBooked = updatedCurrentStudents >= (slot.maxStudents || 1);

    await prisma.$runCommandRaw({
      update: "mentorTimeSlot",
      filter: { _id: timeSlotId },
      updates: {
        $set: createDateUpdate({
          currentStudents: updatedCurrentStudents,
          isBooked: isNowBooked,
          bookedBy: timeSlot.maxStudents === 1 ? session.user.id : timeSlot.bookedBy,
        }) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: sessionBookingData._id,
        timeSlot: {
          id: timeSlot._id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType,
        },
        mentor: {
          name: mentor.name,
          mentorType: mentor.mentorType,
        },
        amount: sessionBookingData.amount,
        scheduledAt: sessionBookingData.scheduledAt,
      },
    });
  } catch (error) {
    console.error("Error verifying time slot payment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to verify payment and complete booking" },
      { status: 500 }
    );
  }
}
