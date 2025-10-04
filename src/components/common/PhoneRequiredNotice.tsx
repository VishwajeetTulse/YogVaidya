import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, AlertCircle, ArrowRight } from "lucide-react";

interface PhoneRequiredNoticeProps {
  onComplete: () => void;
  title?: string;
  description?: string;
  actionText?: string;
}

export default function PhoneRequiredNotice({
  onComplete,
  title = "Phone Number Required",
  description = "Please add your phone number to complete this action. We need it for session notifications and account security.",
  actionText = "Add Phone Number",
}: PhoneRequiredNoticeProps) {
  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      {/* Icon */}
      <div className="w-16 h-16 bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] rounded-full flex items-center justify-center mx-auto mb-4">
        <Phone className="w-8 h-8 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">{description}</p>

      {/* Alert Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-medium text-amber-800 text-sm">Why do we need this?</h3>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• Session reminders and updates</li>
              <li>• Emergency contact for live sessions</li>
              <li>• Account security and verification</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onComplete}
        className="w-full bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] hover:from-[#6bc8f0] hover:to-[#4db390] text-white h-12 rounded-lg font-medium transition-all flex items-center justify-center"
      >
        {actionText}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}
