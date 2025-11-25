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
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <TimeSlotCheckout />
    </Suspense>
  );
}
