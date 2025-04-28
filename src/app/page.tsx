import OurServices from "@/components/OurServices";
import PricingPlans from "@/components/PricingPlans";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
      <PricingPlans />

      {/* Footer */}
      <Footer />
    </div>
  );
}
