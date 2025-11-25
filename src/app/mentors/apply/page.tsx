import { headers } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import { redirect } from "next/navigation";
import { auth } from "@/lib/config/auth";
import MentorApplicationForm from "@/components/mentor/MentorApplicationForm";
import { prisma } from "@/lib/config/prisma";

export default async function MentorApplyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin?from=mentor");
  }

  // Check if user has phone number
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  if (!user?.phone) {
    redirect("/complete-profile?redirectTo=" + encodeURIComponent("/mentors/apply"));
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar showBackButton={true} />
      <MentorApplicationForm />
    </div>
  );
}
