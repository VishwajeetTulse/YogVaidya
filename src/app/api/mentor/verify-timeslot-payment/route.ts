import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

import { AuthenticationError, NotFoundError, ValidationError } from "@/lib/utils/error-handler";

// Interface for timeSlot properties from MongoDB
interface TimeSlotData {
  _id?: string;
  startTime?: string;
  endTime?: string;
}

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  bookingId: z.string().min(1, "Booking ID is required"),
  timeSlotId: z.string().min(1, "Time slot ID is required"),
  // Add booking data fields that were prepared but not saved
  userId: z.string().optional(),
  mentorId: z.string().optional(),
  sessionType: z.string().optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.warn("🔐 Verifying time slot payment...");

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      timeSlotId,
      userId,
      mentorId,
      sessionType,
      scheduledAt,
      duration,
      notes,
    } = verifyPaymentSchema.parse(body);

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Payment signature verification failed");
      throw new ValidationError("Payment verification failed");
    }

    console.warn("✅ Payment signature verified");

    const { prisma } = await import("@/lib/config/prisma");

    // Fetch time slot details to get all the info we need
    const timeSlotResult = await prisma.$runCommandRaw({
      find: "mentorTimeSlot",
      filter: { _id: timeSlotId },
    });

    let timeSlot: Prisma.JsonObject | null = null;
    let timeSlotPrice = 500; // Default fallback

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
      timeSlotPrice =
        timeSlot &&
        typeof timeSlot === "object" &&
        "price" in timeSlot &&
        typeof timeSlot.price === "number"
          ? timeSlot.price
          : 500;
    }

    if (!timeSlot) {
      throw new NotFoundError("Time slot not found");
    }

    // Cast to TimeSlotData for property access
    const slot = timeSlot as unknown as TimeSlotData;

    // Calculate duration if not provided
    let sessionDuration = duration;
    if (!sessionDuration && slot.startTime && slot.endTime) {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      sessionDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    // NOW create the SessionBooking (only after payment is verified)
    console.warn("💾 Creating SessionBooking record after payment verification...");

    try {
      // Use type assertion to include duration field
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bookingData: any = {
        id: bookingId,
        userId: userId || session.user.id,
        mentorId: (mentorId || timeSlot.mentorId) as string,
        timeSlotId: timeSlotId,
        sessionType: (sessionType || timeSlot.sessionType) as string,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt as string)
          : new Date(timeSlot.startTime as string),
        duration: sessionDuration || 60,
        status: "SCHEDULED",
        notes: notes || "",
        paymentStatus: "COMPLETED",
        amount: timeSlotPrice,
        paymentDetails: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: timeSlotPrice,
          currency: "INR",
        },
      };

      const booking = await prisma.sessionBooking.create({
        data: bookingData,
      });

      console.warn("✅ SessionBooking created successfully:", booking.id);
    } catch (error: unknown) {
      console.error("❌ Failed to create SessionBooking:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create booking after payment verification" },
        { status: 500 }
      );
    }

    // Update the time slot's current students count
    const { createDateUpdate } = await import("@/lib/utils/date-utils");

    await prisma.$runCommandRaw({
      update: "mentorTimeSlot",
      updates: [
        {
          q: { _id: timeSlotId },
          u: {
            $inc: { currentStudents: 1 },
            $set: createDateUpdate({}) as Prisma.InputJsonValue,
          },
        },
      ],
    });

    console.warn("✅ Time slot student count updated");

    return NextResponse.json({
      success: true,
      data: {
        message: "Payment verified and booking confirmed",
        bookingId,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
