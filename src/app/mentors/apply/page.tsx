import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MentorApplicationForm from "@/components/MentorApplicationForm";

export default async function MentorApplyPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      redirect("/signin?from=mentor");
    }
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar showBackButton={true} />
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-10">
          <MentorApplicationForm />
      </section>
      <Footer />
    </div>
  );
}