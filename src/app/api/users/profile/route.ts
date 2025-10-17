import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { AuthenticationError, NotFoundError } from "@/lib/utils/error-handler";
import { successResponse, errorResponse } from "@/lib/utils/response-handler";

export async function GET() {
  try {
    // Get the session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw new AuthenticationError("User session not found");
    }

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        mentorType: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User profile not found");
    }

    return successResponse(
      {
        ...user,
        hasPhone: !!user.phone,
      },
      200,
      "User profile retrieved successfully"
    );
  } catch (error) {
    return errorResponse(error);
  }
}
