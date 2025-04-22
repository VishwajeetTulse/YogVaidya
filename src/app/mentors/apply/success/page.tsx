"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplicationSuccessPage() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Application Submitted!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for applying to be a YogaVaidya mentor. We've received your application and will review it soon.
        </p>
        
        <p className="text-gray-600 mb-8">
          We'll get back to you via email within 3-5 business days with the next steps.
        </p>
        
        <Link href="/">
          <Button className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white flex items-center mx-auto">
            Return to Homepage
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
} 