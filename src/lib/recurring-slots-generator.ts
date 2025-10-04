/**
 * Recurring Time Slots Generator Utility
 * Handles generation of individual time slot instances for recurring slots
 */

interface RecurringSlotConfig {
  mentorId: string;
  sessionType: string;
  startTime: string; // ISO string for the original slot time
  endTime: string;
  sessionLink: string;
  notes?: string;
  recurringDays: string[]; // ["MONDAY", "TUESDAY", "WEDNESDAY"]
  maxStudents: number;
  price: number;
  generateForDays?: number; // How many days ahead to generate (default: 7)
  mentorApplicationId?: string;
  startFromDate?: string; // ISO string - custom start date (defaults to tomorrow if not provided)
}

interface SlotGenerationResult {
  success: boolean;
  slotsCreated: number;
  slots: any[];
  error?: string;
}

/**
 * Generate individual time slot instances for recurring slots
 */
export async function generateRecurringTimeSlots(
  config: RecurringSlotConfig
): Promise<SlotGenerationResult> {
  const {
    mentorId,
    sessionType,
    startTime,
    endTime,
    sessionLink,
    notes,
    recurringDays,
    maxStudents,
    price,
    generateForDays = 7, // Default to 7 days for your requirement
    mentorApplicationId,
    startFromDate,
  } = config;

  try {
    const { prisma } = await import("@/lib/config/prisma");

    const originalStart = new Date(startTime);
    const originalEnd = new Date(endTime);
    const timeDiff = originalEnd.getTime() - originalStart.getTime();

    const slotsToCreate = [];
    const now = new Date();

    // Use custom start date if provided, otherwise start from tomorrow
    // When startFromDate is provided, extract just the date part (ignore time)
    const generationStartDate = startFromDate
      ? (() => {
          const date = new Date(startFromDate);
          date.setHours(0, 0, 0, 0); // Reset to start of day for date comparison
          return date;
        })()
      : (() => {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return tomorrow;
        })();

    console.log(
      `🔄 Generating recurring slots for ${generateForDays} days starting from ${generationStartDate.toDateString()}...`
    );
    console.log(`📅 Recurring days: ${recurringDays.join(", ")}`);
    console.log(
      `📅 Generation window: ${generationStartDate.toDateString()} to ${new Date(generationStartDate.getTime() + (generateForDays - 1) * 24 * 60 * 60 * 1000).toDateString()}`
    );

    // Generate slots for the next N days starting from the specified date
    for (let dayOffset = 0; dayOffset < generateForDays; dayOffset++) {
      const targetDate = new Date(generationStartDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dayName = targetDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

      // Check if this day is in the recurring days
      if (recurringDays.includes(dayName)) {
        // Create slot for this day
        const slotStart = new Date(targetDate);
        slotStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

        const slotEnd = new Date(slotStart.getTime() + timeDiff);

        // Double-check: Skip if slot is somehow in the past (should never happen now)
        if (slotStart <= now) {
          console.log(`⚠️  Unexpected: Skipping past slot: ${slotStart.toLocaleString()}`);
          continue;
        }

        const slotData = {
          _id: `recurring_${mentorId}_${slotStart.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          mentorId,
          mentorApplicationId: mentorApplicationId || null,
          startTime: slotStart,
          endTime: slotEnd,
          sessionType,
          maxStudents,
          currentStudents: 0,
          isRecurring: true,
          recurringDays,
          price,
          sessionLink,
          notes: notes || "",
          isActive: true,
          isBooked: false,
          bookedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        slotsToCreate.push(slotData);
        console.log(`✅ Prepared slot for ${dayName} ${slotStart.toLocaleString()}`);
      }
    }

    if (slotsToCreate.length > 0) {
      // Check for existing slots to prevent duplicates
      const existingSlots = await prisma.mentorTimeSlot.findMany({
        where: {
          mentorId,
          isRecurring: true,
          startTime: {
            in: slotsToCreate.map((slot) => slot.startTime),
          },
        },
        select: { startTime: true },
      });

      const existingTimes = new Set(existingSlots.map((slot) => slot.startTime.getTime()));
      const uniqueSlots = slotsToCreate.filter(
        (slot) => !existingTimes.has(slot.startTime.getTime())
      );

      if (uniqueSlots.length > 0) {
        // Use Prisma's createMany for better compatibility
        await prisma.mentorTimeSlot.createMany({
          data: uniqueSlots.map((slot) => ({
            id: slot._id,
            mentorId: slot.mentorId,
            mentorApplicationId: slot.mentorApplicationId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            sessionType: slot.sessionType as any, // Type assertion for enum
            maxStudents: slot.maxStudents,
            currentStudents: slot.currentStudents,
            isRecurring: slot.isRecurring,
            recurringDays: slot.recurringDays,
            price: slot.price,
            sessionLink: slot.sessionLink,
            notes: slot.notes,
            isActive: slot.isActive,
            isBooked: slot.isBooked,
            bookedBy: slot.bookedBy,
          })),
        });

        console.log(
          `🎉 Generated ${uniqueSlots.length} recurring time slots for mentor ${mentorId}`
        );
        if (slotsToCreate.length > uniqueSlots.length) {
          console.log(`ℹ️  Skipped ${slotsToCreate.length - uniqueSlots.length} duplicate slots`);
        }
      } else {
        console.log(`ℹ️  All ${slotsToCreate.length} slots already exist - no duplicates created`);
      }
    } else {
      console.log(`ℹ️  No slots generated - no matching days in the next ${generateForDays} days`);
    }

    const actualSlotsCreated =
      slotsToCreate.length > 0
        ? await prisma.mentorTimeSlot.count({
            where: {
              mentorId,
              isRecurring: true,
              startTime: {
                in: slotsToCreate.map((slot) => slot.startTime),
              },
            },
          })
        : 0;

    return {
      success: true,
      slotsCreated: actualSlotsCreated,
      slots: slotsToCreate,
    };
  } catch (error) {
    console.error("❌ Error generating recurring slots:", error);
    return {
      success: false,
      slotsCreated: 0,
      slots: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Daily maintenance: Generate new recurring slots and clean up old ones
 * This function should be called by a daily cron job
 */
export async function maintainRecurringSlots(): Promise<{
  success: boolean;
  slotsGenerated: number;
  slotsDeleted: number;
  error?: string;
}> {
  try {
    console.log("🔧 Starting daily recurring slots maintenance...");
    const { prisma } = await import("@/lib/config/prisma");

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Step 1: Clean up old slots (slots that have already passed)
    console.log(`🗑️  Cleaning up slots older than: ${now.toISOString()}`);

    const deleteResult = await prisma.mentorTimeSlot.deleteMany({
      where: {
        AND: [
          { isRecurring: true },
          { endTime: { lt: now } }, // Delete slots whose end time has passed
        ],
      },
    });

    const slotsDeleted = deleteResult.count;
    console.log(`🗑️  Deleted ${slotsDeleted} expired recurring slots`);

    // Step 2: Find all unique recurring templates (patterns)
    // We use findMany with distinct-like logic since we need the actual data
    const allRecurringSlots = await prisma.mentorTimeSlot.findMany({
      where: {
        isRecurring: true,
        isActive: true,
        startTime: { gt: now }, // Only future slots
      },
      select: {
        mentorId: true,
        sessionType: true,
        recurringDays: true,
        startTime: true,
        endTime: true,
        sessionLink: true,
        notes: true,
        maxStudents: true,
        price: true,
        mentorApplicationId: true,
      },
    });

    // Group by template pattern to find unique recurring schedules
    const templateMap = new Map<
      string,
      {
        pattern: any;
        count: number;
        latestSlot: any;
      }
    >();

    for (const slot of allRecurringSlots) {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      // Create template key based on the pattern, not specific dates
      const templateKey = JSON.stringify({
        mentorId: slot.mentorId,
        sessionType: slot.sessionType,
        recurringDays: slot.recurringDays.sort(), // Sort for consistent keys
        hour: startTime.getHours(),
        minute: startTime.getMinutes(),
        duration: endTime.getTime() - startTime.getTime(),
        sessionLink: slot.sessionLink,
        maxStudents: slot.maxStudents,
        price: slot.price,
      });

      if (!templateMap.has(templateKey)) {
        templateMap.set(templateKey, {
          pattern: {
            mentorId: slot.mentorId,
            sessionType: slot.sessionType,
            recurringDays: slot.recurringDays,
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
            duration: endTime.getTime() - startTime.getTime(),
            sessionLink: slot.sessionLink,
            notes: slot.notes,
            maxStudents: slot.maxStudents,
            price: slot.price,
            mentorApplicationId: slot.mentorApplicationId,
          },
          count: 1,
          latestSlot: slot,
        });
      } else {
        const existing = templateMap.get(templateKey)!;
        existing.count++;
        // Keep track of the latest slot for this pattern
        if (new Date(slot.startTime) > new Date(existing.latestSlot.startTime)) {
          existing.latestSlot = slot;
        }
      }
    }

    console.log(`📋 Found ${templateMap.size} unique recurring patterns`);

    let totalGenerated = 0;

    // Step 3: For each template, ensure we have enough future slots (7-day window)
    for (const [_templateKey, templateInfo] of templateMap) {
      const pattern = templateInfo.pattern;
      const currentCount = templateInfo.count;
      const latestSlot = new Date(templateInfo.latestSlot.startTime);

      console.log(`🔄 Processing pattern for mentor ${pattern.mentorId} (${pattern.sessionType})`);
      console.log(`   Current slots: ${currentCount}, Days: [${pattern.recurringDays.join(", ")}]`);

      // Calculate how many days ahead we need to extend the window
      const daysBeyondLatest = Math.ceil(
        (latestSlot.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      const targetDaysAhead = Math.max(7, daysBeyondLatest + 1); // Ensure at least 7 days ahead

      // Find the latest slot date and generate from the next day
      const startGenerationDate = new Date(latestSlot);
      startGenerationDate.setDate(startGenerationDate.getDate() + 1);
      startGenerationDate.setHours(pattern.hour, pattern.minute, 0, 0);

      const endGenerationTime = new Date(startGenerationDate.getTime() + pattern.duration);

      // Generate additional slots to maintain the rolling window
      const slotsToGenerate = calculateMissingSlots(
        pattern.recurringDays,
        startGenerationDate,
        targetDaysAhead
      );

      if (slotsToGenerate > 0) {
        console.log(
          `   📅 Generating ${slotsToGenerate} additional slots starting from ${startGenerationDate.toDateString()}`
        );

        const result = await generateRecurringTimeSlots({
          mentorId: pattern.mentorId,
          sessionType: pattern.sessionType,
          startTime: startGenerationDate.toISOString(),
          endTime: endGenerationTime.toISOString(),
          sessionLink: pattern.sessionLink,
          notes: pattern.notes,
          recurringDays: pattern.recurringDays,
          maxStudents: pattern.maxStudents,
          price: pattern.price,
          generateForDays: targetDaysAhead,
          mentorApplicationId: pattern.mentorApplicationId,
          startFromDate: startGenerationDate.toISOString(), // Use the specific date for maintenance
        });

        totalGenerated += result.slotsCreated;
        console.log(`   ✅ Generated ${result.slotsCreated} new slots`);
      } else {
        console.log(`   ✅ Pattern has sufficient future slots`);
      }
    }

    console.log(
      `✅ Daily maintenance completed. Generated ${totalGenerated} new slots, deleted ${slotsDeleted} old slots.`
    );

    return {
      success: true,
      slotsGenerated: totalGenerated,
      slotsDeleted,
    };
  } catch (error) {
    console.error("❌ Error in recurring slots maintenance:", error);
    return {
      success: false,
      slotsGenerated: 0,
      slotsDeleted: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to calculate how many slots we need to generate
function calculateMissingSlots(
  recurringDays: string[],
  startDate: Date,
  daysAhead: number
): number {
  const dayNumbers = recurringDays.map((day) => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return days.indexOf(day);
  });

  let count = 0;
  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(startDate.getDate() + i);
    if (dayNumbers.includes(checkDate.getDay())) {
      count++;
    }
  }

  return count;
}
