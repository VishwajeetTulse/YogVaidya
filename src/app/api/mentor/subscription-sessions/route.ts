import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/config/prisma";
import { convertMongoDate } from "@/lib/utils/datetime-utils";
import type { ScheduleDocument } from "@/lib/types/sessions";
import type { MongoCommandResult } from "@/lib/types/mongodb";

// Schema for creating subscription sessions
const createSubscriptionSessionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledTime: z.string().min(1, "Please select a date and time"),
  link: z.string().url("Please enter a valid session link"),
  duration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(180, "Duration cannot exceed 3 hours"),
  sessionType: z.enum(["YOGA", "MEDITATION"], {
    required_error: "Session type is required for subscription sessions",
    invalid_type_error: "Subscription sessions can only be YOGA or MEDITATION",
  }),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      scheduledTime,
      link,
      duration,
      sessionType,
      notes: _notes,
    } = createSubscriptionSessionSchema.parse(body);

    // Check if user is a mentor
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        role: "MENTOR",
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Only mentors can create subscription sessions" },
        { status: 403 }
      );
    }

    // Validate mentor type matches session type
    const mentorType = user.mentorType;
    if (sessionType === "YOGA" && mentorType !== "YOGAMENTOR") {
      return NextResponse.json(
        { success: false, error: "Only Yoga mentors can create yoga sessions" },
        { status: 403 }
      );
    }
    if (sessionType === "MEDITATION" && mentorType !== "MEDITATIONMENTOR") {
      return NextResponse.json(
        { success: false, error: "Only Meditation mentors can create meditation sessions" },
        { status: 403 }
      );
    }

    // DIET mentors cannot create subscription sessions (they don't have subscription plans)
    if (mentorType === "DIETPLANNER") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Subscription sessions are not available for Diet mentors. Diet mentors use individual time slots only.",
        },
        { status: 403 }
      );
    }

    // Validate scheduledTime format and ensure it's in the future
    const sessionDateTime = convertMongoDate(scheduledTime);
    if (!sessionDateTime || isNaN(sessionDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date and time format" },
        { status: 400 }
      );
    }

    if (sessionDateTime <= new Date()) {
      return NextResponse.json(
        { success: false, error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Determine which subscription plans can access this session
    let eligiblePlans: ("SEED" | "BLOOM" | "FLOURISH")[] = [];
    if (sessionType === "YOGA") {
      eligiblePlans = ["BLOOM", "FLOURISH"]; // BLOOM gets yoga, FLOURISH gets both
    } else if (sessionType === "MEDITATION") {
      eligiblePlans = ["SEED", "FLOURISH"]; // SEED gets meditation, FLOURISH gets both
    }

    // Get all active users with eligible subscription plans
    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: "USER",
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: {
          in: eligiblePlans,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
      },
    });

    // Generate unique ID for the schedule
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the main schedule entry for group session
    const newSchedule = await prisma.schedule.create({
      data: {
        id: scheduleId,
        title,
        scheduledTime: sessionDateTime,
        link,
        duration,
        sessionType,
        status: "SCHEDULED",
        mentorId: session.user.id,
      },
    });

    // Count by subscription plan for response
    const planCounts = {
      SEED: eligibleUsers.filter((u) => u.subscriptionPlan === "SEED").length,
      BLOOM: eligibleUsers.filter((u) => u.subscriptionPlan === "BLOOM").length,
      FLOURISH: eligibleUsers.filter((u) => u.subscriptionPlan === "FLOURISH").length,
    };

    // Prepare response data for group session
    const response = {
      success: true,
      data: {
        scheduleId: newSchedule.id,
        title: newSchedule.title,
        scheduledTime: newSchedule.scheduledTime, // Keep as Date object
        sessionType: newSchedule.sessionType,
        duration: newSchedule.duration,
        link: newSchedule.link,
        eligibleUsers: eligibleUsers.length,
        eligiblePlans: eligiblePlans,
        summary: {
          totalEligibleUsers: eligibleUsers.length,
          byPlan: planCounts,
        },
        sessionFormat: "GROUP", // Mark as group session
        notes: "This is a group session available for all eligible subscription users",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating subscription session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create subscription session" },
      { status: 500 }
    );
  }
}

// GET - Fetch subscription sessions for the mentor
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get all schedules created by this mentor
    // Use $runCommandRaw to handle corrupted date strings in the database
    const scheduleResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            mentorId: session.user.id,
          },
        },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $and: [{ $ne: ["$scheduledTime", null] }, { $ne: ["$scheduledTime", ""] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$scheduledTime",
                      },
                    },
                    else: "$scheduledTime",
                  },
                },
                else: null,
              },
            },
            createdAt: {
              $cond: {
                if: { $and: [{ $ne: ["$createdAt", null] }, { $ne: ["$createdAt", ""] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$createdAt" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$createdAt",
                      },
                    },
                    else: "$createdAt",
                  },
                },
                else: null,
              },
            },
            updatedAt: {
              $cond: {
                if: { $and: [{ $ne: ["$updatedAt", null] }, { $ne: ["$updatedAt", ""] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$updatedAt",
                      },
                    },
                    else: "$updatedAt",
                  },
                },
                else: null,
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            id: "$_id",
            title: 1,
            scheduledTime: 1,
            duration: 1,
            sessionType: 1,
            status: 1,
            link: 1,
            notes: 1,
            mentorId: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: { scheduledTime: -1 },
        },
      ],
      cursor: {},
    });

    let schedules: ScheduleDocument[] = [];
    if (
      scheduleResult &&
      typeof scheduleResult === "object" &&
      "cursor" in scheduleResult &&
      scheduleResult.cursor &&
      typeof scheduleResult.cursor === "object" &&
      "firstBatch" in scheduleResult.cursor &&
      Array.isArray(scheduleResult.cursor.firstBatch)
    ) {
      schedules = (scheduleResult as unknown as MongoCommandResult<ScheduleDocument>).cursor!
        .firstBatch;
    }

    // Convert date strings to Date objects
    schedules = schedules.map((schedule) => ({
      ...schedule,
      id: schedule.id || schedule._id,
      scheduledTime: convertMongoDate(schedule.scheduledTime) || new Date(),
      createdAt: convertMongoDate(schedule.createdAt) || new Date(),
      updatedAt: convertMongoDate(schedule.updatedAt) || new Date(),
    }));

    // For subscription sessions, we don't create individual bookings
    // Instead, we return the schedule info with eligible user counts
    const enrichedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        // For subscription sessions, get eligible users based on session type and their plans
        let eligiblePlans: ("SEED" | "BLOOM" | "FLOURISH")[] = [];
        if (schedule.sessionType === "YOGA") {
          eligiblePlans = ["BLOOM", "FLOURISH"];
        } else if (schedule.sessionType === "MEDITATION") {
          eligiblePlans = ["SEED", "FLOURISH"];
        }

        const eligibleUsers = await prisma.user.findMany({
          where: {
            role: "USER",
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: {
              in: eligiblePlans,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionPlan: true,
          },
        });

        // Count by subscription plan
        const planCounts = {
          SEED: eligibleUsers.filter((u) => u.subscriptionPlan === "SEED").length,
          BLOOM: eligibleUsers.filter((u) => u.subscriptionPlan === "BLOOM").length,
          FLOURISH: eligibleUsers.filter((u) => u.subscriptionPlan === "FLOURISH").length,
        };

        // Keep datetime fields as Date objects (don't convert to ISO strings)
        const scheduleData = {
          ...schedule,
          // scheduledTime, createdAt, updatedAt remain as Date objects
        };

        return {
          ...scheduleData,
          totalBookings: eligibleUsers.length, // Use eligible users as "bookings" for group sessions
          planCounts,
          bookings: [], // No individual bookings for subscription sessions
          sessionFormat: "GROUP",
          notes: "This is a group session available for all eligible subscription users",
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedSchedules,
    });
  } catch (error) {
    console.error("Error fetching subscription sessions:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription sessions" },
      { status: 500 }
    );
  }
}
