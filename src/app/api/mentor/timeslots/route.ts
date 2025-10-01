import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";

// Schema for creating time slots
const createTimeSlotSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  sessionType: z.enum(["YOGA", "MEDITATION", "DIET"], {
    required_error: "Session type is required",
    invalid_type_error: "Session type must be YOGA, MEDITATION, or DIET",
  }),
  maxStudents: z.number().min(1).max(10).default(1),
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.string()).default([]),
  sessionLink: z.string().url().min(1, "Session link is required"),
  notes: z.string().optional(),
});

// Schema for getting time slots
const getTimeSlotsSchema = z.object({
  mentorId: z.string().optional(),
  date: z.string().optional(),
  sessionType: z.enum(["YOGA", "MEDITATION", "DIET"]).optional(),
  available: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    console.log("🚀 Creating mentor time slot...");
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startTime, endTime, sessionType, maxStudents, isRecurring, recurringDays, sessionLink, notes } = 
      createTimeSlotSchema.parse(body);

    const { prisma } = await import("@/lib/config/prisma");

    // Check if user is a mentor
    const user = await prisma.user.findFirst({
      where: { 
        id: session.user.id,
        role: "MENTOR"
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Only mentors can create time slots" },
        { status: 403 }
      );
    }

    // Get mentor application for additional context
    const mentorApplication = await prisma.mentorApplication.findFirst({
      where: { 
        OR: [
          { userId: session.user.id },
          { email: user.email }
        ],
        status: "approved"
      }
    });

    if (isRecurring && recurringDays.length > 0) {
      // ENHANCED: Generate multiple time slots for recurring schedule
      console.log(`🔄 Creating recurring time slots for days: ${recurringDays.join(', ')}`);
      
      const { generateRecurringTimeSlots } = await import("@/lib/recurring-slots-generator");
      
      const result = await generateRecurringTimeSlots({
        mentorId: session.user.id,
        sessionType,
        startTime,
        endTime,
        sessionLink,
        notes,
        recurringDays,
        maxStudents,
        price: user.sessionPrice || 500,
        generateForDays: 7, // Generate for next 7 days as requested
        mentorApplicationId: mentorApplication?.id || undefined
      });

      if (result.success) {
        console.log(`✅ Successfully created ${result.slotsCreated} recurring time slots`);
        
        return NextResponse.json({
          success: true,
          message: `Created ${result.slotsCreated} recurring time slots for the next 7 days`,
          data: {
            slotsCreated: result.slotsCreated,
            recurringDays,
            generatedForDays: 7,
            isRecurring: true,
            sessionType,
            timeRange: `${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}`
          },
        });
      } else {
        console.error("❌ Failed to create recurring slots:", result.error);
        return NextResponse.json(
          { success: false, error: result.error || "Failed to create recurring slots" },
          { status: 500 }
        );
      }
    } else {
      // EXISTING: Create single time slot (non-recurring)
      console.log("📅 Creating single time slot (non-recurring)");
      
      const timeSlotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create the time slot using Prisma to ensure proper date handling
      const timeSlot = await prisma.mentorTimeSlot.create({
        data: {
          id: timeSlotId,
          mentorId: session.user.id,
          mentorApplicationId: mentorApplication?.id || null,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          sessionType: sessionType,
          maxStudents: maxStudents,
          currentStudents: 0,
          isRecurring: false, // Single slots are not recurring
          recurringDays: [],
          price: user.sessionPrice || 500,
          sessionLink: sessionLink,
          notes: notes || "",
          isActive: true,
          isBooked: false,
          bookedBy: null,
        }
      });

      console.log("✅ Single time slot created successfully:", timeSlot.id);

      return NextResponse.json({
        success: true,
        message: "Single time slot created successfully",
        data: {
          id: timeSlot.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          sessionType: timeSlot.sessionType,
          maxStudents: timeSlot.maxStudents,
          price: timeSlot.price,
          sessionLink: timeSlot.sessionLink,
          isRecurring: timeSlot.isRecurring,
          recurringDays: timeSlot.recurringDays,
        },
      });
    }

  } catch (error) {
    console.error("Error creating time slot:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create time slot" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log("🔍 Fetching mentor time slots...");
    
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    const date = searchParams.get('date');
    const sessionType = searchParams.get('sessionType');
    const available = searchParams.get('available');

    const { prisma } = await import("@/lib/config/prisma");

    // Build filter for MongoDB query
    const filter: any = {
      isActive: true
    };

    if (mentorId) {
      filter.mentorId = mentorId;
    }

    if (sessionType) {
      filter.sessionType = sessionType;
    }

    if (available === 'true') {
      // Only show slots that have available capacity
      filter.$expr = { $lt: ['$currentStudents', '$maxStudents'] };
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      filter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Fetch time slots using raw MongoDB operation
    const timeSlotsResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: filter,
      sort: { startTime: -1 } // Changed to -1 to show recent time slots first
    });

    // Parse the MongoDB result
    let timeSlots: any[] = [];
    if (timeSlotsResult && 
        typeof timeSlotsResult === 'object' && 
        'cursor' in timeSlotsResult &&
        timeSlotsResult.cursor &&
        typeof timeSlotsResult.cursor === 'object' &&
        'firstBatch' in timeSlotsResult.cursor &&
        Array.isArray(timeSlotsResult.cursor.firstBatch)) {
      timeSlots = timeSlotsResult.cursor.firstBatch;
    }

    // Get mentor details for each slot
    const mentorIds = [...new Set(timeSlots.map((slot: any) => slot.mentorId))];
    const mentors = await prisma.user.findMany({
      where: {
        id: { in: mentorIds },
        role: "MENTOR"
      },
      select: {
        id: true,
        name: true,
        email: true,
        mentorType: true,
        image: true
      }
    });

    // Enhance time slots with mentor data and availability check
    let enhancedTimeSlots = timeSlots.map((slot: any) => {
      const mentor = mentors.find(m => m.id === slot.mentorId);
      
      // Convert MongoDB Extended JSON dates to ISO strings for frontend
      const convertDateToString = (dateValue: any): string => {
        if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
          return dateValue.$date;
        }
        return dateValue;
      };
      
      return {
        ...slot,
        startTime: convertDateToString(slot.startTime),
        endTime: convertDateToString(slot.endTime),
        createdAt: convertDateToString(slot.createdAt),
        updatedAt: convertDateToString(slot.updatedAt),
        mentor: mentor
      };
    });

    // If filtering by availability, also check for pending session bookings
    if (available === 'true') {
      console.log("🔍 Checking for pending bookings to filter unavailable slots...");
      
      const timeSlotIds = enhancedTimeSlots.map(slot => slot._id);
      
      // Get pending session bookings for these time slots
      const pendingBookingsResult = await prisma.$runCommandRaw({
        aggregate: 'sessionBooking',
        pipeline: [
          {
            $match: {
              timeSlotId: { $in: timeSlotIds },
              status: { $in: ["SCHEDULED", "ONGOING"] },
              $or: [
                { paymentStatus: "COMPLETED" },
                { paymentStatus: "PENDING" }
              ]
            }
          },
          {
            $group: {
              _id: '$timeSlotId',
              count: { $sum: 1 }
            }
          }
        ],
        cursor: {}
      });

      let pendingBookings: any[] = [];
      if (pendingBookingsResult && 
          typeof pendingBookingsResult === 'object' && 
          'cursor' in pendingBookingsResult &&
          pendingBookingsResult.cursor &&
          typeof pendingBookingsResult.cursor === 'object' &&
          'firstBatch' in pendingBookingsResult.cursor &&
          Array.isArray(pendingBookingsResult.cursor.firstBatch)) {
        pendingBookings = pendingBookingsResult.cursor.firstBatch;
      }

      console.log(`📊 Found pending bookings for ${pendingBookings.length} time slots`);

      // Filter out time slots that are fully booked (including pending bookings)
      enhancedTimeSlots = enhancedTimeSlots.filter((slot: any) => {
        const pendingCount = pendingBookings.find(pb => pb._id === slot._id)?.count || 0;
        const totalBooked = (slot.currentStudents || 0) + pendingCount;
        const isAvailable = totalBooked < slot.maxStudents;
        
        if (!isAvailable) {
          console.log(`🚫 Filtering out fully booked slot: ${slot._id} (${totalBooked}/${slot.maxStudents})`);
        }
        
        return isAvailable;
      });
    }

    console.log(`✅ Found ${enhancedTimeSlots.length} time slots`);

    return NextResponse.json({
      success: true,
      data: enhancedTimeSlots,
    });

  } catch (error) {
    console.error("Error fetching time slots:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch time slots" },
      { status: 500 }
    );
  }
}
