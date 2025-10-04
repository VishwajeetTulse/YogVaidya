import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";

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
    console.log("🔐 Verifying time slot payment...");

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    console.log("✅ Payment signature verified");

    const { prisma } = await import("@/lib/config/prisma");

    // Fetch time slot details to get all the info we need
    const timeSlotResult = await prisma.$runCommandRaw({
      find: "mentorTimeSlot",
      filter: { _id: timeSlotId },
    });

    let timeSlot: any = null;
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
      timeSlot = timeSlotResult.cursor.firstBatch[0] as any;
      timeSlotPrice =
        timeSlot &&
        typeof timeSlot === "object" &&
        "price" in timeSlot &&
        typeof timeSlot.price === "number"
          ? timeSlot.price
          : 500;
    }

    if (!timeSlot) {
      return NextResponse.json({ success: false, error: "Time slot not found" }, { status: 404 });
    }

    // Calculate duration if not provided
    let sessionDuration = duration;
    if (!sessionDuration && timeSlot.startTime && timeSlot.endTime) {
      const start = new Date(timeSlot.startTime);
      const end = new Date(timeSlot.endTime);
      sessionDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    // NOW create the SessionBooking (only after payment is verified)
    console.log("💾 Creating SessionBooking record after payment verification...");

    try {
      // Use type assertion to include duration field
      const bookingData: any = {
        id: bookingId,
        userId: userId || session.user.id,
        mentorId: mentorId || timeSlot.mentorId,
        timeSlotId: timeSlotId,
        sessionType: sessionType || timeSlot.sessionType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(timeSlot.startTime),
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

      console.log("✅ SessionBooking created successfully:", booking.id);
    } catch (error: any) {
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
            $set: createDateUpdate({}),
          },
        },
      ],
    });

    console.log("✅ Time slot student count updated");

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
