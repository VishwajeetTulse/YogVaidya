import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

import { AuthenticationError, NotFoundError, ValidationError } from "@/lib/utils/error-handler";

export async function GET(request: Request, { params }: { params: Promise<{ mentorId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { mentorId } = await params;

    // Cache individual mentor details with 5 minute TTL
    const mentorData = await withCache(
      `mentor:details:${mentorId}`,
      async () => {
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

        if (!mentorExists) {
          throw new NotFoundError("Mentor not found");
        }

        if (mentorExists.role !== "MENTOR") {
          throw new ValidationError("User is not a mentor");
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
          throw new NotFoundError("Mentor not found");
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

        return {
          ...mentor,
          experience: mentorApp?.experience,
          certifications: mentorApp?.certifications,
          expertise: mentorApp?.expertise,
        };
      },
      CACHE_TTL.MEDIUM
    );

    return NextResponse.json({
      success: true,
      data: mentorData,
    });
  } catch (error) {
    console.error("Error fetching mentor details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch mentor details" },
      { status: 500 }
    );
  }
}

// POST endpoint to invalidate mentor details cache
export async function POST(request: Request, { params }: { params: Promise<{ mentorId: string }> }) {
  try {
    const { mentorId } = await params;
    await invalidateCache(`mentor:details:${mentorId}`);
    return NextResponse.json({ success: true, message: "Cache invalidated" });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json({ success: false, error: "Failed to invalidate cache" }, { status: 500 });
  }
}
