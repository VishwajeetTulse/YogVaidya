import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PlansDashboard from "@/components/dashboard/plans-dashboard";

export default async function PlansPage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlansDashboard />
    </div>
  );
}
