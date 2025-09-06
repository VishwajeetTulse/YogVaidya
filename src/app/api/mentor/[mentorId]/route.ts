import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mentorId } = await params;

    console.log(`🔍 Looking for mentor with ID: ${mentorId}`);

    const { prisma } = await import("@/lib/config/prisma");
    
    // First, let's check if the mentor exists at all
    const mentorExists = await prisma.user.findFirst({
      where: {
        id: mentorId,
      },
      select: {
        id: true,
        role: true,
        isAvailable: true,
      },
    });

    console.log(`🔍 Mentor existence check:`, mentorExists);

    if (!mentorExists) {
      console.log(`❌ Mentor not found with ID: ${mentorId}`);
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
    }

    if (mentorExists.role !== "MENTOR") {
      console.log(`❌ User ${mentorId} is not a mentor, role: ${mentorExists.role}`);
      return NextResponse.json(
        { success: false, error: "User is not a mentor" },
        { status: 400 }
      );
    }

    // Now get the full mentor data (remove isAvailable requirement for now)
    const mentor = await prisma.user.findFirst({
      where: {
        id: mentorId,
        role: "MENTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        sessionPrice: true,
        mentorType: true,
        isAvailable: true,
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { success: false, error: "Mentor not found" },
        { status: 404 }
      );
    }

    // Get mentor application details
    const mentorApp = await prisma.mentorApplication.findFirst({
      where: {
        userId: mentorId,
        status: "APPROVED",
      },
      select: {
        experience: true,
        certifications: true,
        expertise: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...mentor,
        experience: mentorApp?.experience,
        certifications: mentorApp?.certifications,
        expertise: mentorApp?.expertise,
      },
    });

  } catch (error) {
    console.error("Error fetching mentor details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch mentor details" },
      { status: 500 }
    );
  }
}
