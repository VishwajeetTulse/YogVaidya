import { Suspense } from "react";
import SessionCheckout from "@/components/checkout/SessionCheckout";
import { auth } from "@/lib/config/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SessionCheckoutPage({
  searchParams,
}: {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    mentorId: string;
    [key: string]: string | string[] | undefined;
  }>;
}) {
  // Check if user is authenticated
  const { mentorId } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/signin");
  }

  // Validate mentorId
  if (!mentorId || typeof mentorId !== "string") {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading session checkout...</p>
          </div>
        </div>
      }
    >
      <SessionCheckout mentorId={mentorId} />
    </Suspense>
  );
}
