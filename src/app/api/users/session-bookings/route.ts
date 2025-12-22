import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { withCache, CACHE_TTL } from "@/lib/cache/redis";

import { AuthenticationError } from "@/lib/utils/error-handler";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { prisma } = await import("@/lib/config/prisma");

    // Cache user session bookings with 1 minute TTL
    const bookings = await withCache(
      `users:session-bookings:${session.user.id}`,
      async () => {
        // For now, since we can't generate the new schema, let's return a placeholder
        // Once Prisma is regenerated, this will fetch actual session bookings

        try {
          // Try to access sessionBooking model
          return await prisma.sessionBooking.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              image: true,
              mentorType: true,
            },
          },
        },
        orderBy: {
          scheduledAt: "desc",
        },
          });
        } catch {
          // If sessionBooking model doesn't exist yet, return empty array
          return [];
        }
      },
      CACHE_TTL.SHORT
    );

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
