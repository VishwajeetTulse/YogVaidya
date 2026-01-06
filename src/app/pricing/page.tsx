import PlansDashboard from "@/components/dashboard/plans-dashboard";

// Enable static generation for pricing page
// This page doesn't change often, so we can pre-render it
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      {/* Pricing Plans Section */}
      <PlansDashboard />
    </div>
  );
}
