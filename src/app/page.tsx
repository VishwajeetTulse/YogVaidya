import OurServices from "@/components/landing/OurServices";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PlansDashboard from "@/components/dashboard/plans-dashboard";

export default async function YogaLandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }
  const navItems = [
    { label: "Home", href: "#" },
    { label: "Services", href: "#services" },
    { label: "Plans", href: "#plans" },
    { label: "Mentors", href: "/mentors" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <Navbar navItems={navItems} currentPath="#" />

      {/* Hero Section */}
      <Hero />

      {/* Our Services Section */}
      <OurServices />

      {/* Pricing Plans Section */}
      <PlansDashboard />

      {/* Footer */}
      <Footer />
    </div>
  );
}
