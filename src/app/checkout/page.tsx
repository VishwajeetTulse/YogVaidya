import { Suspense } from "react";
import Checkout from "@/components/checkout/Checkout";
import { auth } from "@/lib/config/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Page({
  searchParams,
}: {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    plan: string;
    [key: string]: string | string[] | undefined;
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
      <Checkout plan={plan.toLowerCase()} />
    </Suspense>
  );
}
