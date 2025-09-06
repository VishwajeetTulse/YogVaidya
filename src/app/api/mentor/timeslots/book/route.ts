import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";

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
    console.log("🚀 Booking time slot...");
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timeSlotId, notes } = bookTimeSlotSchema.parse(body);

    const { prisma } = await import("@/lib/config/prisma");

    // Get the time slot details
    const timeSlotResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: { _id: timeSlotId, isActive: true }
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

    // Check if slot is already booked or at capacity
    if (timeSlot.currentStudents >= timeSlot.maxStudents) {
      return NextResponse.json(
        { success: false, error: "Time slot is fully booked" },
        { status: 409 }
      );
    }

    // Check if user already has an active session with this mentor
    const existingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        userId: session.user.id,
        mentorId: timeSlot.mentorId,
        status: { $in: ["PENDING", "CONFIRMED"] },
        paymentStatus: "COMPLETED"
      }
    });

    let existingSessions: any[] = [];
    if (existingSessionsResult && 
        typeof existingSessionsResult === 'object' && 
        'cursor' in existingSessionsResult &&
        existingSessionsResult.cursor &&
        typeof existingSessionsResult.cursor === 'object' &&
        'firstBatch' in existingSessionsResult.cursor &&
        Array.isArray(existingSessionsResult.cursor.firstBatch)) {
      existingSessions = existingSessionsResult.cursor.firstBatch;
    }

    if (existingSessions.length > 0) {
      return NextResponse.json(
        { success: false, error: "You already have an active session with this mentor" },
        { status: 409 }
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

    // Create Razorpay order
    const amount = timeSlot.price || mentor.sessionPrice || 500; // Use slot price or mentor default
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const receipt = `ts_${Date.now()}`.substring(0, 13); // Limit to 13 characters

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        userId: session.user.id,
        timeSlotId: timeSlotId,
        mentorId: timeSlot.mentorId,
        sessionType: timeSlot.sessionType,
      },
    });

    console.log("✅ Razorpay order created successfully:", razorpayOrder.id);

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
          price: amount
        },
        mentor: {
          name: mentor.name,
          mentorType: mentor.mentorType
        }
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
