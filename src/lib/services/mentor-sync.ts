"use server";

import { prisma } from "../config/prisma";

/**
 * Sync mentor types from approved mentor applications to user records
 * This is useful for fixing existing data where mentorType wasn't updated during approval
 */
export async function syncMentorTypes() {
  try {
    // Get all approved mentor applications
    const approvedApplications = await prisma.mentorApplication.findMany({
      where: {
        status: "approved",
      },
      select: {
        email: true,
        mentorType: true,
        name: true,
      },
    });

    let updatedCount = 0;

    // Update each user's mentorType based on their approved application
    for (const app of approvedApplications) {
      if (app.mentorType) {
        const result = await prisma.user.updateMany({
          where: {
            email: app.email,
            role: "MENTOR",
            // Only update if mentorType is null or doesn't match
            OR: [{ mentorType: null }, { mentorType: { not: app.mentorType } }],
          },
          data: {
            mentorType: app.mentorType,
          },
        });

        if (result.count > 0) {
          updatedCount += result.count;
        }
      }
    }

    return {
      success: true,
      message: `Updated ${updatedCount} mentor records with correct mentorType`,
      totalApproved: approvedApplications.length,
      updated: updatedCount,
    };
  } catch (error) {
    console.error("Error syncing mentor types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync mentor types",
    };
  }
}

/**
 * Get mentor statistics to check data consistency
 */
export async function getMentorStats() {
  try {
    const [
      totalMentors,
      mentorsWithType,
      mentorsWithoutType,
      approvedApplications,
      yogaMentors,
      meditationMentors,
      dietPlanners,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "MENTOR" } }),
      prisma.user.count({ where: { role: "MENTOR", mentorType: { not: null } } }),
      prisma.user.count({ where: { role: "MENTOR", mentorType: null } }),
      prisma.mentorApplication.count({ where: { status: "approved" } }),
      prisma.user.count({ where: { role: "MENTOR", mentorType: "YOGAMENTOR" } }),
      prisma.user.count({ where: { role: "MENTOR", mentorType: "MEDITATIONMENTOR" } }),
      prisma.user.count({ where: { role: "MENTOR", mentorType: "DIETPLANNER" } }),
    ]);

    return {
      success: true,
      stats: {
        totalMentors,
        mentorsWithType,
        mentorsWithoutType,
        approvedApplications,
        yogaMentors,
        meditationMentors,
        dietPlanners,
        typeConsistency: mentorsWithType === approvedApplications,
      },
    };
  } catch (error) {
    console.error("Error getting mentor stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get mentor stats",
    };
  }
}
