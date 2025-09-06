import { NextRequest, NextResponse } from "next/server";
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
});

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Verifying time slot payment...");
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      bookingId, 
      timeSlotId 
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

    // Update session booking with payment details
    const updateResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [{
        q: { _id: bookingId, userId: session.user.id },
        u: { 
          $set: { 
            paymentDetails: {
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              amount: 1500, // We'll get this from the order later
              currency: "INR"
            },
            paymentStatus: "COMPLETED",
            updatedAt: new Date()
          }
        }
      }]
    });

    console.log("✅ Payment details updated in database");

    // Also update the time slot's current students count
    await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      updates: [{
        q: { _id: timeSlotId },
        u: { 
          $inc: { currentStudents: 1 },
          $set: { updatedAt: new Date() }
        }
      }]
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
