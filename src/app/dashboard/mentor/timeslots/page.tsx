import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TimeSlotManager from "@/components/dashboard/mentor/TimeSlotManager";

export default async function MentorTimeSlotsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin");
  }

  // Check if user is a mentor
  const { prisma } = await import("@/lib/config/prisma");
  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      role: "MENTOR",
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only mentors can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TimeSlotManager />
    </div>
  );
}
