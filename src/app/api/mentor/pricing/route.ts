import { type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";
import { AuthenticationError, AuthorizationError, ValidationError } from "@/lib/utils/error-handler";
import { errorResponse, successResponse } from "@/lib/utils/response-handler";

const pricingSchema = z.object({
  sessionPrice: z.number().min(0).max(10000, "Session price must be between 0 and 10,000"),
});

// GET - Get mentor's current pricing
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is a mentor
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      throw new AuthenticationError("User session not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        sessionPrice: true,
      },
    });

    if (!user || user.role !== "MENTOR") {
      throw new AuthorizationError("Only mentors can access pricing");
    }

    return successResponse(
      { sessionPrice: user.sessionPrice },
      200,
      "Mentor pricing retrieved successfully"
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT - Update mentor's pricing
export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated and is a mentor
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      throw new AuthenticationError("User session not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "MENTOR") {
      throw new AuthorizationError("Only mentors can update pricing");
    }

    // Parse and validate request body
    const body = await request.json();
    const pricingData = pricingSchema.parse(body);

    // Update mentor pricing
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionPrice: pricingData.sessionPrice,
      },
      select: {
        sessionPrice: true,
      },
    });

    return successResponse(
      { sessionPrice: updatedUser.sessionPrice },
      200,
      "Pricing updated successfully"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid pricing data", { errors: error.errors });
    }
    return errorResponse(error);
  }
}
