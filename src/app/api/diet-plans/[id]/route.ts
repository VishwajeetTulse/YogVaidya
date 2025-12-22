import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { withCache, CACHE_TTL } from "@/lib/cache/redis";

import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/utils/error-handler";

// GET - Fetch a single diet plan by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { id } = await params;
    
    // Cache diet plan with 2 minute TTL
    const dietPlanData = await withCache(
      `diet-plan:${id}`,
      async () => {
        const dietPlan = await prisma.dietPlan.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!dietPlan) {
      throw new NotFoundError("Diet plan not found");
    }

    // Transform tags - handle both string and array formats
    let tags: string[] = [];
    if (dietPlanData.tags) {
      if (typeof dietPlanData.tags === "string") {
        tags = (dietPlanData.tags as string).split(",").map((t: string) => t.trim());
      } else if (Array.isArray(dietPlanData.tags)) {
        tags = dietPlanData.tags;
      }
    }

    const transformedDietPlan = {
      ...dietPlanData,
      tags,
    };

        return transformedDietPlan;
      },
      CACHE_TTL.SHORT
    );

    // Check if user is authorized (either the mentor who created it or the student it's for)
    if (dietPlanData.mentorId !== session.user.id && dietPlanData.studentId !== session.user.id) {
      throw new AuthorizationError("Unauthorized");
    }

    return NextResponse.json({
      success: true,
      dietPlan: dietPlanData,
    });
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch diet plan" },
      { status: 500 }
    );
  }
}
