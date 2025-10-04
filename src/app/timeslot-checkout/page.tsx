import { Suspense } from "react";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TimeSlotCheckout from "@/components/checkout/TimeSlotCheckout";

export default async function TimeSlotCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ timeSlotId?: string; mentorId?: string }>;
}) {
  // Get user session
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin");
  }

  const resolvedParams = await searchParams;
  const { timeSlotId, mentorId: _mentorId } = resolvedParams;

  if (!timeSlotId) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <TimeSlotCheckout />
    </Suspense>
  );
}
