import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TimeSlotBrowser from "@/components/dashboard/student/TimeSlotBrowser";

export default async function BrowseTimeSlotsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TimeSlotBrowser />
    </div>
  );
}
