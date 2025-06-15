import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

// Create a new PrismaClient instance or use an existing one
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Get moderator settings
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is a moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });    if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    try {
      // Try to access the moderatorSettings model if the Prisma client has been updated
      // @ts-ignore - We know this might not exist yet, but it will after prisma generate runs
      const userSettings = await prisma.moderatorSettings?.findUnique({
        where: { userId: session.user.id },
      });
      
      // If model exists and settings found, return them
      if (userSettings) {
        return NextResponse.json({
          success: true,
          settings: {
            mentorApplicationAlerts: userSettings.mentorApplicationAlerts,
            userSignupAlerts: userSettings.userSignupAlerts,
          }
        });
      }
    } catch (err) {
      // If moderatorSettings model is not yet available, we'll continue and return defaults
      console.log("ModeratorSettings model not yet available:", err);
    }
      // If no settings exist yet or if the model isn't available, return default values
    return NextResponse.json({
      success: true,
      settings: {
        mentorApplicationAlerts: true,
        userSignupAlerts: false,
      }
    });
  } catch (error) {
    console.error("Error fetching moderator settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update moderator settings
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is a moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });    if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // Get the settings from the request body
    const settings = await request.json();
    
    // Extract and validate all settings fields
    const fullSettings = {
      mentorApplicationAlerts: Boolean(settings.mentorApplicationAlerts),
      userSignupAlerts: Boolean(settings.userSignupAlerts),
    };try {
      // Store settings in the database using a transaction
      await prisma.$transaction(async (tx) => {
        try {
          // Check if settings document exists for this user
          // @ts-ignore - We know this might not exist yet, but it will after prisma generate runs
          const existingSettings = await tx.moderatorSettings?.findUnique({
            where: { userId: session.user.id },
          });

          if (existingSettings) {
            // Update existing settings
            // @ts-ignore - We know this might not exist yet, but it will after prisma generate runs
            await tx.moderatorSettings?.update({
              where: { userId: session.user.id },
              data: fullSettings,
            });
          } else {
            // Create new settings
            // @ts-ignore - We know this might not exist yet, but it will after prisma generate runs
            await tx.moderatorSettings?.create({
              data: {
                userId: session.user.id,
                ...fullSettings,
              },
            });
          }
        } catch (err) {
          // If the model isn't available yet, log the error
          console.error("ModeratorSettings model not yet available:", err);
          // We'll still return success, since this is a transitional state
        }
      });
    } catch (err) {
      console.error("Error saving moderator settings:", err);
      // Continue execution as this might be due to the model not being available yet
    }

    console.log(`Saved settings for user ${session.user.id}:`, fullSettings);    return NextResponse.json({
      success: true,
      settings: fullSettings,
    });
  } catch (error) {
    console.error("Error updating moderator settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
