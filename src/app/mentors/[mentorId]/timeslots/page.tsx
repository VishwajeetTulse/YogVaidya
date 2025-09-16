import { Suspense } from "react";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MentorTimeSlotBrowser from "@/components/mentor/MentorTimeSlotBrowser";

export default async function MentorTimeSlotsPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  // Get user session
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/signin");
  }

  const resolvedParams = await params;
  const { mentorId } = resolvedParams;

  if (!mentorId) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading available sessions...</p>
        </div>
      </div>
    }>
      <MentorTimeSlotBrowser mentorId={mentorId} />
    </Suspense>
  );
}
