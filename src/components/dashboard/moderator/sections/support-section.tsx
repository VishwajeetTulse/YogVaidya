"use client";

import { Card } from "@/components/ui/card";
import { PhoneCall, Mail } from "lucide-react";

export const SupportSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get assistance, documentation, and answers to common questions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm">
          <div>
            <h3 className="font-medium flex items-center text-gray-900">
              <PhoneCall size={18} className="mr-2 text-primary" />
              Phone Support
            </h3>
            <p className="text-sm text-gray-600 mt-1">Available Mon-Fri, 9am-5pm</p>
            <p className="font-medium mt-2 text-lg">+1 (555) 123-4567</p>
          </div>
        </Card>
        <Card className="p-6 shadow-sm">
          <div>
            <h3 className="font-medium flex items-center text-gray-900">
              <Mail size={18} className="mr-2 text-primary" />
              Email Support
            </h3>
            <p className="text-sm text-gray-600 mt-1">24/7 response within 24 hours</p>
            <p className="font-medium mt-2 text-lg">support@yogavaidya.com</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
