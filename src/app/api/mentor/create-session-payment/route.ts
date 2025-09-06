import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";

const createPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  mentorId: z.string().min(1, "Mentor ID is required"),
  timeSlotId: z.string().min(1, "Time slot ID is required"),
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Creating payment order for time slot booking...");
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, amount, mentorId, timeSlotId } = createPaymentSchema.parse(body);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `timeslot_${bookingId}`,
      notes: {
        userId: session.user.id,
        mentorId,
        timeSlotId,
        bookingId,
        type: "timeslot_booking"
      }
    });

    console.log("✅ Payment order created:", order.id);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        currency: "INR",
        receipt: order.receipt,
      },
    });

  } catch (error) {
    console.error("Error creating payment order:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
