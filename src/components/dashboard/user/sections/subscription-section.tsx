import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { type SectionProps } from "../types";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getBillingHistoryAction } from "@/lib/actions/billing-actions";
import { CancelSubscriptionDialog } from "../CancelSubscriptionDialog";
import { useTrialExpiration } from "@/hooks/use-trial-expiration";
import { Skeleton } from "@/components/ui/skeleton";

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date;
  description: string;
  orderId: string | null;
  planName: string;
  planType: string;
  paymentMethod: string;
  formattedStatus: string;
  razorpayPaymentId: string;
}

export const SubscriptionSection = ({
  userDetails,
  cancellingSubscription,
  handleCancelSubscription,
  formatDate,
  refreshSubscriptionData,
}: SectionProps) => {
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showAllBills, setShowAllBills] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check if trial is actually active (not expired)
  const isTrialActiveAndValid =
    userDetails.isTrialActive &&
    userDetails.trialEndDate &&
    new Date() < new Date(userDetails.trialEndDate);

  // Check if trial has expired
  const isTrialExpired =
    userDetails.trialEndDate &&
    new Date() >= new Date(userDetails.trialEndDate) &&
    (!userDetails.subscriptionStatus || userDetails.subscriptionStatus === "INACTIVE") &&
    (!userDetails.paymentAmount || userDetails.paymentAmount === 0) &&
    (!userDetails.subscriptionPlan ||
      (userDetails.subscriptionPlan && !userDetails.subscriptionStartDate));

  // Check if it's a real subscription expiry
  const isSubscriptionExpired =
    !isTrialExpired &&
    userDetails.subscriptionPlan &&
    (userDetails.subscriptionStatus === "INACTIVE" ||
      userDetails.subscriptionStatus === "EXPIRED") &&
    userDetails.subscriptionStartDate &&
    userDetails.paymentAmount &&
    userDetails.paymentAmount > 0;

  // Handle trial expiration and database update
  useTrialExpiration({
    isTrialActive: userDetails.isTrialActive,
    trialEndDate: userDetails.trialEndDate,
    onTrialExpired: () => {
      toast.info("Your trial has expired. Please choose a subscription plan to continue.");
      refreshSubscriptionData?.();
    },
  });

  useEffect(() => {
    const fetchBillingHistory = async () => {
      if (userDetails.email) {
        setLoadingHistory(true);
        try {
          const result = await getBillingHistoryAction(userDetails.email);

          if (result.success) {
            setBillingHistory(result.history || []);
          } else {
            console.error("Failed to fetch billing history:", result.error);
            toast.error(`Failed to load payment history: ${result.error}`);
            setBillingHistory([]);
          }
        } catch (error) {
          console.error("Error fetching billing history:", error);
          toast.error("Error loading payment history. Please try refreshing the page.");
          setBillingHistory([]);
        } finally {
          setLoadingHistory(false);
        }
      } else {
        setLoadingHistory(false);
        setBillingHistory([]);
      }
    };

    fetchBillingHistory();
  }, [userDetails.email]);

  // Don't block the entire section on billing history - show subscription info immediately

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription plan and billing history.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {isTrialActiveAndValid
              ? "Free Trial"
              : isTrialExpired
                ? "Trial Expired"
                : "Current Plan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isTrialActiveAndValid
                    ? "Free Trial - FLOURISH Access"
                    : isTrialExpired
                      ? "Trial Expired - Subscribe to Continue"
                      : isSubscriptionExpired
                        ? `${userDetails.subscriptionPlan} Plan Expired`
                        : userDetails.subscriptionPlan || "No Active Plan"}
                </h3>
                <p className="text-gray-600 text-lg">
                  {isTrialActiveAndValid
                    ? "🎉 You have full FLOURISH plan access during your trial - all features unlocked!"
                    : isTrialExpired
                      ? "⏰ Your trial period with FLOURISH access has ended. Choose a subscription plan to continue"
                      : isSubscriptionExpired
                        ? `⏰ Your ${userDetails.subscriptionPlan} subscription has expired. Renew to restore access to all features`
                        : userDetails.subscriptionPlan === "BLOOM"
                          ? "🧘‍♀️ Perfect for yoga enthusiasts - Unlimited access to yoga sessions"
                          : userDetails.subscriptionPlan === "FLOURISH"
                            ? "🌸 Complete wellness journey - All features included"
                            : userDetails.subscriptionPlan === "SEED"
                              ? "🌱 Perfect for meditation enthusiasts - Mindfulness practices"
                              : "Choose a plan to begin your wellness transformation"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 font-medium">
                    {isTrialActiveAndValid || isTrialExpired ? "Trial Status" : "Plan"}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {isTrialActiveAndValid
                      ? "Free Trial (FLOURISH)"
                      : isTrialExpired
                        ? "Trial Expired"
                        : isSubscriptionExpired
                          ? `${userDetails.subscriptionPlan} (Expired)`
                          : userDetails.subscriptionPlan || "None"}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 font-medium">Status</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {isTrialActiveAndValid
                      ? "Trial Active"
                      : isTrialExpired
                        ? "Trial Expired"
                        : isSubscriptionExpired
                          ? "Subscription Expired"
                          : userDetails.subscriptionStatus || "Inactive"}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 font-medium">
                    {isTrialActiveAndValid
                      ? "Trial Ends"
                      : isTrialExpired
                        ? "Trial Ended"
                        : "Next Billing"}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {isTrialActiveAndValid
                      ? formatDate?.(userDetails.trialEndDate) || "N/A"
                      : isTrialExpired
                        ? formatDate?.(userDetails.trialEndDate) || "N/A"
                        : formatDate?.(userDetails.nextBillingDate) || "N/A"}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-500 font-medium">Started</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {formatDate?.(userDetails.subscriptionStartDate || userDetails.createdAt) ||
                      "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="space-y-6">
              {isTrialActiveAndValid ? (
                <>
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-blue-700 mb-3">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold text-lg">Free Trial Active</span>
                    </div>
                    <p className="text-blue-600 mb-3">
                      You&apos;re currently enjoying full access to all YogaVaidya features during
                      your free trial period.
                    </p>
                    {userDetails.trialEndDate && (
                      <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg border border-blue-200">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Trial ends on: <strong>{formatDate?.(userDetails.trialEndDate)}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 bg-gray-400 text-white font-semibold rounded-xl shadow-sm cursor-not-allowed opacity-60"
                      disabled={true}
                    >
                      🔒 Purchase Available After Trial
                    </Button>
                  </div>
                </>
              ) : isTrialExpired ? (
                <>
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-orange-700 mb-3">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold text-lg">Trial Expired</span>
                    </div>
                    <p className="text-orange-600 mb-3">
                      Your free trial has ended. Subscribe to a plan to continue accessing all
                      YogaVaidya features.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm"
                      onClick={() => (window.location.href = "/pricing")}
                    >
                      🚀 Subscribe Now - Restore Access
                    </Button>
                  </div>
                </>
              ) : userDetails.subscriptionStatus === "ACTIVE" ||
                userDetails.subscriptionStatus === "ACTIVE_UNTIL_END" ? (
                <>
                  {userDetails.subscriptionStatus === "ACTIVE" && (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
                      <div className="flex items-center gap-3 text-green-700 mb-3">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold text-lg">Subscription Active</span>
                      </div>
                      <p className="text-green-600">
                        Your subscription is active and will renew automatically. Enjoy unlimited
                        access to all features.
                      </p>
                    </div>
                  )}

                  {userDetails.subscriptionStatus === "ACTIVE_UNTIL_END" && (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-1" />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg text-amber-800">
                              Subscription Cancelled
                            </span>
                            <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                              EXPIRES SOON
                            </span>
                          </div>
                          <p className="text-amber-700 mb-3">
                            Your subscription has been cancelled but you&apos;ll continue to have
                            full access until your next billing date.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      className="w-full h-10 sm:h-12 bg-gray-400 text-white cursor-not-allowed rounded-xl shadow-sm text-sm sm:text-base"
                      disabled={true}
                    >
                      ✨ Upgrade Temporarily Unavailable
                    </Button>
                    {userDetails.subscriptionStatus === "ACTIVE" && (
                      <Button
                        variant="outline"
                        className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={cancellingSubscription}
                      >
                        {cancellingSubscription ? "Processing..." : "Cancel Subscription"}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-orange-700 mb-3">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold text-lg">Ready to Start?</span>
                    </div>
                    <p className="text-orange-600">
                      Choose a subscription plan to unlock all wellness features and start your
                      transformation journey.
                    </p>
                  </div>
                  <Button
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm"
                    onClick={() => (window.location.href = "/pricing")}
                  >
                    🚀 Choose Your Plan
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Payment History
            {loadingHistory && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border rounded-xl">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-6 w-20 ml-auto" />
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : billingHistory.length > 0 ? (
            <div className="space-y-4">
              {(showAllBills ? billingHistory : billingHistory.slice(0, 3)).map((bill) => (
                <div
                  key={bill.id}
                  className="p-6 border rounded-xl hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          bill.formattedStatus === "Successful"
                            ? "bg-green-100"
                            : bill.formattedStatus === "Failed"
                              ? "bg-red-100"
                              : "bg-gray-100"
                        }`}
                      >
                        {bill.formattedStatus === "Successful" ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : bill.formattedStatus === "Failed" ? (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        ) : (
                          <Calendar className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{bill.planName}</p>
                        <p className="text-gray-600 font-medium">{formatDate?.(bill.createdAt)}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                            {bill.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{bill.amount.toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          bill.formattedStatus === "Successful"
                            ? "bg-green-100 text-green-700"
                            : bill.formattedStatus === "Failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bill.formattedStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {billingHistory.length > 3 && (
                <div className="pt-6 text-center border-t">
                  <Button variant="outline" onClick={() => setShowAllBills(!showAllBills)}>
                    {showAllBills
                      ? "Show Recent Only"
                      : `View All Transactions (+${billingHistory.length - 3} more)`}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isTrialActiveAndValid
                    ? "No Payment History During Trial"
                    : "No Payment History Yet"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {isTrialActiveAndValid
                    ? "You're currently on a free trial. Payment transactions will appear here once you subscribe to a plan."
                    : "Your payment transactions will appear here once you start your subscription journey."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={async () => {
          if (!handleCancelSubscription) return;
          try {
            const result = await handleCancelSubscription();
            if (result.success) {
              toast.success(result.details?.message || "Subscription cancelled successfully");
              await refreshSubscriptionData?.();
              setShowCancelDialog(false);
            } else {
              toast.error(result.message || "Failed to cancel subscription");
            }
          } catch (error) {
            console.error("Error cancelling:", error);
            toast.error("Failed to cancel subscription");
          }
        }}
        isLoading={cancellingSubscription || false}
        userDetails={userDetails}
      />
    </div>
  );
};
