import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";

const verifySessionPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  mentorId: z.string(),
  sessionDate: z.string(),
  sessionTime: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
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
      mentorId,
      sessionDate,
      sessionTime,
      notes 
    } = verifySessionPaymentSchema.parse(body);

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Payment verified, create session booking in database
    const { prisma } = await import("@/lib/config/prisma");
    
    // First, get mentor details
    const mentor = await prisma.user.findFirst({
      where: {
        id: mentorId,
        role: "MENTOR",
      },
      select: {
        id: true,
        name: true,
        sessionPrice: true,
        mentorType: true,
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
    }

    // Map MentorType to SessionType
    const getSessionType = (mentorType: string | null): "YOGA" | "MEDITATION" | "DIET" => {
      switch (mentorType) {
        case "YOGAMENTOR":
          return "YOGA";
        case "MEDITATIONMENTOR":
          return "MEDITATION";
        case "DIETPLANNER":
          return "DIET";
        default:
          return "YOGA";
      }
    };

    // Create a new session booking entry using Prisma
    const sessionBookingData = {
      _id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      mentorId: mentorId,
      sessionType: getSessionType(mentor.mentorType),
      scheduledAt: new Date(`${sessionDate}T${sessionTime}`),
      status: "SCHEDULED",
      notes: notes || "",
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: mentor.sessionPrice,
        currency: "INR",
      },
      // Removed createdAt and updatedAt - let Prisma auto-generate these
    };

    // Create the session booking using Prisma to ensure proper date handling
    const sessionBooking = await prisma.sessionBooking.create({
      data: {
        id: sessionBookingData._id,
        userId: sessionBookingData.userId,
        mentorId: sessionBookingData.mentorId,
        sessionType: sessionBookingData.sessionType,
        scheduledAt: sessionBookingData.scheduledAt,
        duration: 60, // Default duration for direct bookings (no timeSlot)
        status: "SCHEDULED",
        notes: sessionBookingData.notes,
        paymentStatus: "COMPLETED",
        amount: mentor.sessionPrice,
        paymentDetails: sessionBookingData.paymentDetails
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: sessionBookingData._id,
        mentorName: mentor.name,
        sessionDate,
        sessionTime,
        amount: mentor.sessionPrice,
      },
    });

  } catch (error) {
    console.error("Error verifying session payment:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to verify payment and create booking" },
      { status: 500 }
    );
  }
}
