import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { SectionProps } from "../types";
import { toast } from "sonner";

export const SubscriptionSection = ({ 
  userDetails, 
  cancellingSubscription,
  handleCancelSubscription,
  formatDate, 
  getStatusColor,
  setActiveSection,
  refreshSubscriptionData
}: SectionProps) => {
  const handleCancel = async () => {
    if (!handleCancelSubscription) {
      toast.error("Unable to process cancellation. Please try again later.");
      return;
    }

    try {
      const result = await handleCancelSubscription();
      
      if (!result.success) {
        toast.error(result.message || "Failed to cancel subscription. Please try again.");
        return;
      }

      if (result.alreadyCancelled) {
        toast.info(result.details?.message || "Your subscription is already scheduled for cancellation at the end of the billing period.");
        return;
      }

      toast.success(result.details?.message || "Your subscription has been scheduled for cancellation at the end of the billing period.");
      
      // Refresh subscription data to update UI
      await refreshSubscriptionData?.();
      
    } catch (error) {
      console.error("Error during cancellation:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Plan
          </h2>
          {userDetails.subscriptionStatus && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor?.(
                userDetails.subscriptionStatus
              )}`}
            >
              {userDetails.subscriptionStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {userDetails.subscriptionPlan || "No Active Plan"}
            </h3>
            <p className="text-gray-500 mb-4">
              {userDetails.subscriptionPlan === "BLOOM"
                ? "Perfect for yoga enthusiasts"
                : userDetails.subscriptionPlan === "FLOURISH"
                ? "Complete wellness journey"
                : userDetails.subscriptionPlan === "SEED"
                ? "Perfect for meditation enthusiasts"
                : "Choose a plan to get started"}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span className="font-medium">
                  {userDetails.subscriptionPlan || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">
                  {userDetails.subscriptionStatus || "Inactive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Next Billing:</span>
                <span className="font-medium">
                  {formatDate?.(userDetails.nextBillingDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Started:</span>
                <span className="font-medium">
                  {formatDate?.(userDetails.subscriptionStartDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {userDetails.subscriptionStatus === "ACTIVE" ? (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Subscription Active</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    Your subscription is active and will renew automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-[#876aff] text-[#876aff] hover:bg-[#876aff] hover:text-white"
                    onClick={() => setActiveSection?.("plans")}
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    onClick={handleCancel}
                    disabled={cancellingSubscription}
                  >
                    {cancellingSubscription ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">No Active Subscription</span>
                  </div>
                  <p className="text-orange-600 text-sm mt-1">
                    Subscribe to a plan to access all features.
                  </p>
                </div>
                <Button
                  className="w-full bg-[#76d2fa] hover:bg-[#5a9be9]"
                  onClick={() => setActiveSection?.("plans")}
                >
                  Choose a Plan
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Billing History
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-medium">Monthly Subscription - BLOOM</p>
                <p className="text-sm text-gray-500">
                  {new Date(Date.now() - item * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹1,999</p>
                <p className="text-sm text-green-600">Paid</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
