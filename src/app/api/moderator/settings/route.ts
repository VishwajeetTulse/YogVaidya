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
    };
    
    console.log(`Saved settings for user ${session.user.id}:`, fullSettings);   
     return NextResponse.json({
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
