import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";

const verifyTimeSlotPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  timeSlotId: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    console.log("🔍 Verifying time slot payment...");
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/config/prisma");

    // Get the time slot details
    const timeSlotResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: { _id: timeSlotId }
    });

    let timeSlot: any = null;
    if (timeSlotResult && 
        typeof timeSlotResult === 'object' && 
        'cursor' in timeSlotResult &&
        timeSlotResult.cursor &&
        typeof timeSlotResult.cursor === 'object' &&
        'firstBatch' in timeSlotResult.cursor &&
        Array.isArray(timeSlotResult.cursor.firstBatch)) {
      timeSlot = timeSlotResult.cursor.firstBatch[0];
    }

    if (!timeSlot) {
      return NextResponse.json(
        { success: false, error: "Time slot not found" },
        { status: 404 }
      );
    }

    // Get mentor details
    const mentor = await prisma.user.findFirst({
      where: { 
        id: timeSlot.mentorId,
        role: "MENTOR" 
      },
      select: {
        id: true,
        name: true,
        email: true,
        sessionPrice: true,
        mentorType: true
      }
    });

    if (!mentor) {
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
    }

    // Get mentor application for reference
    const mentorApplication = await prisma.mentorApplication.findFirst({
      where: { 
        OR: [
          { userId: timeSlot.mentorId },
          { email: mentor.email }
        ],
        status: "approved"
      }
    });

    // Create session booking
    const sessionBookingData = {
      _id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      mentorId: timeSlot.mentorId,
      mentorApplicationId: mentorApplication?.id || null,
      timeSlotId: timeSlotId,
      sessionType: timeSlot.sessionType,
      scheduledAt: new Date(timeSlot.startTime),
      status: "CONFIRMED",
      notes: notes || "",
      amount: timeSlot.price || mentor.sessionPrice || 500,
      paymentStatus: "COMPLETED",
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: timeSlot.price || mentor.sessionPrice || 500,
        currency: "INR",
      },
      // Removed createdAt and updatedAt - let Prisma auto-generate these
    };

    // Import date utility for consistent date handling
    const { createDateUpdate } = await import("@/lib/utils/date-utils");

    // Calculate duration from timeSlot
    const sessionDuration = Math.round(
      (timeSlot.endTime.getTime() - timeSlot.startTime.getTime()) / (1000 * 60)
    );

    // Create the session booking using Prisma to ensure proper date handling
    const sessionBooking = await prisma.sessionBooking.create({
      data: {
        id: sessionBookingData._id,
        userId: sessionBookingData.userId,
        mentorId: sessionBookingData.mentorId,
        mentorApplicationId: sessionBookingData.mentorApplicationId,
        timeSlotId: sessionBookingData.timeSlotId,
        sessionType: sessionBookingData.sessionType,
        scheduledAt: sessionBookingData.scheduledAt,
        duration: sessionDuration,
        status: "SCHEDULED", // Use proper enum value
        notes: sessionBookingData.notes,
        paymentStatus: sessionBookingData.paymentStatus,
        amount: sessionBookingData.amount,
        paymentDetails: sessionBookingData.paymentDetails
      }
    });

    // Update the time slot to mark as booked
    const updatedCurrentStudents = timeSlot.currentStudents + 1;
    const isNowBooked = updatedCurrentStudents >= timeSlot.maxStudents;

    await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      filter: { _id: timeSlotId },
      updates: {
        $set: createDateUpdate({
          currentStudents: updatedCurrentStudents,
          isBooked: isNowBooked,
          bookedBy: timeSlot.maxStudents === 1 ? session.user.id : timeSlot.bookedBy
        })
      }
    });

    console.log("✅ Time slot booking completed successfully");

    return NextResponse.json({
      success: true,
      data: {
        bookingId: sessionBookingData._id,
        timeSlot: {
          id: timeSlot._id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType
        },
        mentor: {
          name: mentor.name,
          mentorType: mentor.mentorType
        },
        amount: sessionBookingData.amount,
        scheduledAt: sessionBookingData.scheduledAt
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
