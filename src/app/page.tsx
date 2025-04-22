"use client";

import OurServices from "@/components/OurServices";
import PricingPlans from "@/components/PricingPlans";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function YogaLandingPage() {
  const navItems = [
    { label: "Home", href: "#" },
    { label: "Services", href: "#services" },
    { label: "Plans", href: "#plans" },
    { label: "Mentors", href: "/mentors" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen overflow-x-hidden">
      <CustomStyles />
      
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

// Add this at the end of the file for the animation delays
const styles = `
  @keyframes customPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
  
  @keyframes customPulse2 {
    0%, 100% {
      opacity: 0.9;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.08);
    }
  }
  
  @keyframes customPulse3 {
    0%, 100% {
      opacity: 0.8;
      transform: scale(0.98);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.06);
    }
  }
  
  @keyframes customPulse4 {
    0%, 100% {
      opacity: 0.7;
      transform: scale(0.95);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.04);
    }
  }
  
  .animate-custom-pulse {
    animation: customPulse 4s ease-in-out infinite;
  }
  
  .animate-custom-pulse-2 {
    animation: customPulse2 5s ease-in-out infinite;
  }
  
  .animate-custom-pulse-3 {
    animation: customPulse3 6s ease-in-out infinite;
  }
  
  .animate-custom-pulse-4 {
    animation: customPulse4 7s ease-in-out infinite;
  }
  
  .animation-delay-1000 {
    animation-delay: 1000ms;
  }
  
  .animation-delay-2000 {
    animation-delay: 2000ms;
  }
  
  .animation-delay-3000 {
    animation-delay: 3000ms;
  }
`;

function CustomStyles() {
  return <style jsx global>{styles}</style>;
}
