import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import Razorpay from "razorpay";

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
  console.log("🚀 Book session API called - Time Slot Based");
  try {
    console.log("📡 Checking authentication...");
    const session = await auth.api.getSession({ headers: await headers() });
    console.log("👤 Session found:", !!session?.user?.id);
    
    if (!session?.user?.id) {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("📝 Parsing request body...");
    const body = await request.json();
    console.log("📋 Request data:", body);
    
    const { timeSlotId, notes, mentorId, sessionDate, sessionTime } = bookSessionSchema.parse(body);

    const { prisma } = await import("@/lib/config/prisma");

    // NEW APPROACH: Time Slot Based Booking
    if (timeSlotId) {
      console.log("🎯 Time slot based booking for slot:", timeSlotId);
      
      // Get the time slot details and check availability
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: {
          _id: timeSlotId,
          isActive: true,
          $expr: { $lt: ['$currentStudents', '$maxStudents'] } // Check if there's space available
        }
      });

      let timeSlot: any = null;
      if (timeSlotResult && 
          typeof timeSlotResult === 'object' && 
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0];
      }

      if (!timeSlot) {
        console.log("❌ Time slot not found or fully booked");
        return NextResponse.json(
          { success: false, error: "Time slot not available or fully booked" },
          { status: 404 }
        );
      }

      // Double-check availability at application level
      if (timeSlot.currentStudents >= timeSlot.maxStudents) {
        console.log("❌ Time slot is fully booked", {
          currentStudents: timeSlot.currentStudents,
          maxStudents: timeSlot.maxStudents
        });
        return NextResponse.json(
          { success: false, error: "Time slot is fully booked" },
          { status: 409 }
        );
      }

      console.log("✅ Time slot found:", {
        id: timeSlot._id,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        price: timeSlot.price,
        mentorId: timeSlot.mentorId
      });

      // Get mentor details
      const mentor = await prisma.user.findFirst({
        where: {
          id: timeSlot.mentorId,
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
        console.log("❌ Mentor not found or not available");
        return NextResponse.json(
          { success: false, error: "Mentor not available" },
          { status: 404 }
        );
      }

      // Check if user already has an active session with this mentor
      console.log("🔍 Checking for existing sessions with this mentor...");
      const existingSession = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: {
          userId: session.user.id,
          mentorId: timeSlot.mentorId,
          status: { $in: ["SCHEDULED", "ONGOING"] }
        }
      });
      
      const hasExistingSessions = existingSession && 
        typeof existingSession === 'object' && 
        'cursor' in existingSession &&
        existingSession.cursor &&
        typeof existingSession.cursor === 'object' &&
        'firstBatch' in existingSession.cursor &&
        Array.isArray(existingSession.cursor.firstBatch) &&
        existingSession.cursor.firstBatch.length > 0;
      
      if (hasExistingSessions) {
        console.log("❌ User already has an active session with this mentor");
        return NextResponse.json(
          { 
            success: false, 
            error: "You already have an active session with this mentor. Please complete your current session before booking a new one." 
          },
          { status: 409 }
        );
      }

      // Use time slot price or mentor default price
      const sessionPrice = timeSlot.price || mentor.sessionPrice || 500;

      if (!sessionPrice || sessionPrice <= 0) {
        console.log("❌ Session pricing not set or invalid:", sessionPrice);
        return NextResponse.json(
          { success: false, error: "Session pricing not set" },
          { status: 400 }
        );
      }

      console.log("💳 Creating Razorpay order for time slot booking...");
      console.log("💰 Amount:", sessionPrice, "INR");
      
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: sessionPrice * 100, // Convert to paise
        currency: "INR",
        receipt: `slot_${Date.now().toString().slice(-8)}`,
        notes: {
          timeSlotId: timeSlot._id,
          mentorId: timeSlot.mentorId,
          studentId: session.user.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType,
          type: "timeslot_booking",
        },
      });

      console.log("✅ Razorpay order created successfully:", order.id);

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
      console.log("🔄 Legacy booking approach for mentor:", mentorId);
      
      // Keep the existing logic for backward compatibility
      let mentor;
      try {
        const userExists = await prisma.user.findFirst({
          where: { id: mentorId },
          select: { id: true, role: true, isAvailable: true, name: true }
        });
        
        if (!userExists) {
          const application = await prisma.mentorApplication.findFirst({
            where: { id: mentorId, status: "approved" },
            select: { email: true, userId: true, name: true }
          });
          
          if (application) {
            const actualUser = await prisma.user.findFirst({
              where: { 
                OR: [
                  { email: application.email },
                  { id: application.userId || "" }
                ]
              },
              select: { id: true, role: true, isAvailable: true, name: true }
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
        return NextResponse.json(
          { success: false, error: "Database error" },
          { status: 500 }
        );
      }

      if (!mentor) {
        return NextResponse.json(
          { success: false, error: "Mentor not found or unavailable" },
          { status: 404 }
        );
      }

      // Check existing sessions
      const existingSession = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: {
          userId: session.user.id,
          mentorId: mentorId,
          status: { $in: ["SCHEDULED", "ONGOING"] }
        }
      });
      
      const hasExistingSessions = existingSession && 
        typeof existingSession === 'object' && 
        'cursor' in existingSession &&
        existingSession.cursor &&
        typeof existingSession.cursor === 'object' &&
        'firstBatch' in existingSession.cursor &&
        Array.isArray(existingSession.cursor.firstBatch) &&
        existingSession.cursor.firstBatch.length > 0;
      
      if (hasExistingSessions) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You already have an active session with this mentor. Please complete your current session before booking a new one." 
          },
          { status: 409 }
        );
      }

      if (!mentor.sessionPrice || mentor.sessionPrice <= 0) {
        return NextResponse.json(
          { success: false, error: "Mentor pricing not set" },
          { status: 400 }
        );
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
        { success: false, error: "Either timeSlotId or mentorId with sessionDate and sessionTime is required" },
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
