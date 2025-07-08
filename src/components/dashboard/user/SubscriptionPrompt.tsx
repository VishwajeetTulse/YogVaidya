import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Sparkles, Star } from "lucide-react";
import Link from "next/link";

interface SubscriptionPromptProps {
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  nextBillingDate?: string | null;
  isTrialExpired?: boolean; // Add optional prop to detect trial expiration
}

export const SubscriptionPrompt = ({ subscriptionStatus, subscriptionPlan, nextBillingDate, isTrialExpired }: SubscriptionPromptProps) => {
  const isExpired = subscriptionStatus === "CANCELLED" || 
                   subscriptionStatus === "INACTIVE" || 
                   subscriptionStatus === "EXPIRED";
  
  const isCancelledButActive = subscriptionStatus === "ACTIVE_UNTIL_END";
  
  const getStatusMessage = () => {
    if (isTrialExpired) {
      return "Your 1-day trial has ended! You experienced the full power of our platform. Choose a plan to continue your wellness journey with unlimited access to yoga and meditation sessions.";
    }
    
    if (isCancelledButActive && nextBillingDate) {
      const billingDate = new Date(nextBillingDate);
      return `Your subscription has been cancelled but you still have access until ${billingDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric", 
        year: "numeric"
      })}.`;
    }
    
    if (isExpired) {
      return `Your ${subscriptionPlan || "subscription"} plan has expired. Renew your subscription to continue accessing yoga and meditation sessions.`;
    }
    
    return "Subscribe to one of our plans to access personalized yoga and meditation sessions with expert mentors.";
  };
  
  const getTitle = () => {
    if (isTrialExpired) {
      return "Trial Period Ended";
    }
    if (isCancelledButActive) {
      return "Subscription Cancelled";
    }
    if (isExpired) {
      return "Subscription Expired";
    }
    return "Get Access to Sessions";
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-2">
          Manage your scheduled and completed yoga sessions.
        </p>
      </div>

      <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#876aff] to-[#ff7dac] rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getTitle()}
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
          {getStatusMessage()}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-white/50 border border-blue-200">
            <Sparkles className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-700">SEED Plan</h3>
            <p className="text-sm text-gray-600">Meditation Sessions</p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/50 border border-green-200">
            <Star className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-green-700">BLOOM Plan</h3>
            <p className="text-sm text-gray-600">Yoga Sessions</p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/50 border border-purple-200">
            <Crown className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-700">FLOURISH Plan</h3>
            <p className="text-sm text-gray-600">Yoga + Meditation</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button 
            asChild
            className="bg-gradient-to-r from-[#876aff] to-[#ff7dac] hover:from-[#7c5cff] hover:to-[#ff6ba3] text-white"
          >
            <Link href="/pricing">
              {isTrialExpired ? "Continue Your Journey" : (isCancelledButActive ? "Reactivate Subscription" : (isExpired ? "Renew Subscription" : "Choose Your Plan"))}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

