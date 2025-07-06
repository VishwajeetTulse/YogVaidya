import { headers } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import { redirect } from "next/navigation";
import { auth } from "@/lib/config/auth";
import MentorApplicationForm from "@/components/mentor/MentorApplicationForm";

export default async function MentorApplyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin?from=mentor");
  }
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar showBackButton={true} />
      <MentorApplicationForm />
    </div>
  );
}
