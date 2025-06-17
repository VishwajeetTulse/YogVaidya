import { Suspense } from "react";
import Checkout from "@/components/checkout/Checkout";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    slug: string[]
  }>;
  searchParams: Promise<{
    plan: string,
    [key: string]: string | string[] | undefined
  }>;
}) {
  // check if user is authenticated
  const { plan } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/signin");
  }
  // Validate plan
  if (!plan || !["seed", "bloom", "flourish"].includes(plan.toLowerCase())) {
    redirect("/dashboard/plans");
  }

  return (
    <Suspense fallback={
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <Checkout plan={plan.toLowerCase()} />
    </Suspense>
  );
}