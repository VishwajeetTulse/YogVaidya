import { Suspense } from "react";
import SessionCheckout from "@/components/checkout/SessionCheckout";
import { auth } from "@/lib/config/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SessionCheckoutPage({
  searchParams,
}: {
  params: Promise<{
    slug: string[]
  }>;
  searchParams: Promise<{
    mentorId: string,
    [key: string]: string | string[] | undefined
  }>;
}) {
  // Check if user is authenticated
  const { mentorId } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/signin");
  }

  // Validate mentorId
  if (!mentorId || typeof mentorId !== 'string') {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session checkout...</p>
        </div>
      </div>
    }>
      <SessionCheckout mentorId={mentorId} />
    </Suspense>
  );
}
