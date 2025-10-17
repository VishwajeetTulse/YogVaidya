import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/utils/error-handler";

// GET - Fetch a single diet plan by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { id } = await params;
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

    // Check if user is authorized (either the mentor who created it or the student it's for)
    if (dietPlan.mentorId !== session.user.id && dietPlan.studentId !== session.user.id) {
      throw new AuthorizationError("Unauthorized");
    }

    // Transform tags - handle both string and array formats
    let tags: string[] = [];
    if (dietPlan.tags) {
      if (typeof dietPlan.tags === "string") {
        tags = (dietPlan.tags as string).split(",").map((t: string) => t.trim());
      } else if (Array.isArray(dietPlan.tags)) {
        tags = dietPlan.tags;
      }
    }

    const transformedDietPlan = {
      ...dietPlan,
      tags,
    };

    return NextResponse.json({
      success: true,
      dietPlan: transformedDietPlan,
    });
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch diet plan" },
      { status: 500 }
    );
  }
}
