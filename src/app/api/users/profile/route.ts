import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { AuthenticationError, NotFoundError } from "@/lib/utils/error-handler";
import { errorResponse, successResponse } from "@/lib/utils/response-handler";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

export async function GET() {
  try {
    // Get the session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw new AuthenticationError("User session not found");
    }

    // Cache user profile with 1 minute TTL (called on every page load)
    const profile = await withCache(
      `user:profile:${session.user.id}`,
      async () => {
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

        return {
          ...user,
          hasPhone: !!user.phone,
        };
      },
      CACHE_TTL.SHORT // 1 minute
    );

    return successResponse(
      profile,
      200,
      "User profile retrieved successfully"
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST - Invalidate user profile cache
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("User session not found");
    }

    await invalidateCache(`user:profile:${session.user.id}`);
    return successResponse({ message: "Profile cache cleared" }, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
