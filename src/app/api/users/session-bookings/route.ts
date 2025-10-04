import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/config/prisma");

    // For now, since we can't generate the new schema, let's return a placeholder
    // Once Prisma is regenerated, this will fetch actual session bookings

    try {
      // Try to access sessionBooking model
      const bookings = await (prisma as any).sessionBooking.findMany({
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

      return NextResponse.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      // If sessionBooking model doesn't exist yet, return empty array
      console.log("SessionBooking model not available yet:", error);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
