import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { type SectionProps } from "../types";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getBillingHistoryAction } from "@/lib/actions/billing-actions";
import { CancelSubscriptionDialog } from "../CancelSubscriptionDialog";
import { useTrialExpiration } from "@/hooks/use-trial-expiration";

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
  // A trial is expired if there was a trialEndDate in the past and user never made a payment (trial only)
  const isTrialExpired =
    userDetails.trialEndDate &&
    new Date() >= new Date(userDetails.trialEndDate) &&
    (!userDetails.subscriptionStatus || userDetails.subscriptionStatus === "INACTIVE") &&
    // Check that user never made a payment (indicating they only had trial, no paid subscription)
    (!userDetails.paymentAmount || userDetails.paymentAmount === 0) &&
    // If user still has subscription plan but trial expired, they're in transition state (trial expired but DB not updated)
    (!userDetails.subscriptionPlan ||
      (userDetails.subscriptionPlan && !userDetails.subscriptionStartDate));

  // Check if it's a real subscription expiry (user had paid subscription that expired)
  // This applies to users who had actual paid subscriptions (not trial users)
  const isSubscriptionExpired =
    !isTrialExpired &&
    userDetails.subscriptionPlan &&
    (userDetails.subscriptionStatus === "INACTIVE" ||
      userDetails.subscriptionStatus === "EXPIRED") &&
    userDetails.subscriptionStartDate && // Must have had a real subscription start date
    userDetails.paymentAmount &&
    userDetails.paymentAmount > 0; // Must have made a payment

  // Handle trial expiration and database update
  useTrialExpiration({
    isTrialActive: userDetails.isTrialActive,
    trialEndDate: userDetails.trialEndDate,
    onTrialExpired: () => {
      toast.info("Your trial has expired. Please choose a subscription plan to continue.");
      // Refresh the subscription data to reflect the updated state
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
            setBillingHistory([]); // Ensure we set empty array on error
          }
        } catch (error) {
          console.error("Error fetching billing history:", error);
          toast.error("Error loading payment history. Please try refreshing the page.");
          setBillingHistory([]); // Ensure we set empty array on error
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

  return (
    <div className="space-y-8 p-6 animate-in fade-in-50 duration-700">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#876aff] to-[#76d2fa] bg-clip-text text-transparent">
          {isTrialActiveAndValid
            ? "Your Free Trial"
            : isTrialExpired
              ? "Trial Expired"
              : isSubscriptionExpired
                ? "Subscription Expired"
                : userDetails.subscriptionStatus && userDetails.subscriptionStatus !== "INACTIVE"
                  ? "Your Subscription"
                  : "Get Started"}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {isTrialActiveAndValid
            ? "Enjoy full access to all wellness features during your trial period."
            : isTrialExpired
              ? "Your trial has ended. Subscribe to continue your wellness journey."
              : isSubscriptionExpired
                ? `Your ${userDetails.subscriptionPlan} plan has expired. Renew your subscription to continue accessing yoga and meditation sessions.`
                : userDetails.subscriptionStatus && userDetails.subscriptionStatus !== "INACTIVE"
                  ? "Manage your wellness journey with flexible subscription options."
                  : "Choose a subscription plan to begin your wellness transformation."}
        </p>
      </div>

      {/* Current Plan */}
      <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <div className="bg-gradient-to-r from-[#876aff] to-[#76d2fa] p-6 text-white">
          {" "}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">
                {isTrialActiveAndValid
                  ? "Free Trial"
                  : isTrialExpired
                    ? "Trial Expired"
                    : "Current Plan"}
              </h2>
            </div>
            {isTrialActiveAndValid ? (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-100 border border-blue-400/30">
                TRIAL ACTIVE
              </span>
            ) : isTrialExpired ? (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500/20 text-red-100 border border-red-400/30">
                TRIAL EXPIRED
              </span>
            ) : isSubscriptionExpired ? (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-500/20 text-orange-100 border border-orange-400/30">
                SUBSCRIPTION EXPIRED
              </span>
            ) : (
              userDetails.subscriptionStatus && (
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    userDetails.subscriptionStatus === "ACTIVE"
                      ? "bg-green-500/20 text-green-100 border border-green-400/30"
                      : userDetails.subscriptionStatus === "ACTIVE_UNTIL_END"
                        ? "bg-amber-500/20 text-amber-100 border border-amber-400/30"
                        : "bg-red-500/20 text-red-100 border border-red-400/30"
                  }`}
                >
                  {userDetails.subscriptionStatus === "ACTIVE_UNTIL_END"
                    ? "EXPIRES SOON"
                    : userDetails.subscriptionStatus}
                </span>
              )
            )}
          </div>
        </div>

        <div className="p-8">
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
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-blue-700 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
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
                    <p className="text-xs text-blue-600 mt-2">
                      You can choose a subscription plan once your trial period ends.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 cursor-not-allowed opacity-60"
                      disabled={true}
                      title="You cannot purchase a plan during your trial period. Please wait until your trial ends to subscribe."
                    >
                      � Purchase Available After Trial
                    </Button>
                  </div>
                </>
              ) : isTrialExpired ? (
                <>
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-orange-700 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-lg">Trial Expired</span>
                    </div>
                    <p className="text-orange-600 mb-3">
                      Your free trial has ended. Subscribe to a plan to continue accessing all
                      YogaVaidya features.
                    </p>
                    {userDetails.trialEndDate && (
                      <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg border border-orange-200">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Trial ended on: <strong>{formatDate?.(userDetails.trialEndDate)}</strong>
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-orange-600 mt-2">
                      Choose a subscription plan to restore your access and continue your wellness
                      journey.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-[#876aff] to-[#76d2fa] hover:from-[#7c61ff] hover:to-[#6bc8f0] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                      <div className="flex items-center gap-3 text-green-700 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg">Subscription Active</span>
                      </div>
                      <p className="text-green-600">
                        Your subscription is active and will renew automatically. Enjoy unlimited
                        access to all features.
                      </p>
                    </div>
                  )}

                  {/* Cancellation Notice for ACTIVE_UNTIL_END status */}
                  {userDetails.subscriptionStatus === "ACTIVE_UNTIL_END" && (
                    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
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
                            full access to all content and features until your next billing date.
                          </p>
                          <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg border border-amber-200">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">
                              Access expires on:{" "}
                              <strong>
                                {formatDate?.(
                                  userDetails.subscriptionEndDate || userDetails.nextBillingDate
                                ) || "N/A"}
                              </strong>
                            </span>
                          </div>
                          {(userDetails.subscriptionEndDate || userDetails.nextBillingDate) && (
                            <p className="text-xs text-amber-600 mt-2">
                              You can reactivate your subscription anytime before this date to
                              continue seamlessly.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* TODO: Temporarily hidden - uncomment to re-enable upgrade functionality */}
                    {/* <Button
                      className="w-full h-12 bg-gradient-to-r from-[#876aff] to-[#76d2fa] hover:from-[#7c61ff] hover:to-[#6bc8f0] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setActiveSection?.("plans")}
                    >
                      ✨ Upgrade Your Plan
                    </Button> */}
                    <Button
                      className="w-full h-10 sm:h-12 bg-gray-400 text-white cursor-not-allowed rounded-xl shadow-lg transition-all duration-300 text-sm sm:text-base"
                      disabled={true}
                    >
                      <span className="hidden sm:inline">✨ Upgrade Temporarily Unavailable</span>
                      <span className="sm:hidden">✨ Upgrade Unavailable</span>
                    </Button>
                    {userDetails.subscriptionStatus === "ACTIVE" && (
                      <Button
                        variant="outline"
                        className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl transition-all duration-300"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={cancellingSubscription}
                      >
                        {cancellingSubscription ? "Processing..." : "Cancel Subscription"}
                      </Button>
                    )}
                    {userDetails.subscriptionStatus === "ACTIVE_UNTIL_END" && (
                      <Button
                        className="w-full h-12 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 cursor-not-allowed opacity-60"
                        disabled={true}
                        title="Cannot reactivate while subscription is scheduled for cancellation. Please wait until the end of your billing period to purchase a new plan."
                      >
                        🔄 Reactivation Blocked
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-orange-700 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-lg">Ready to Start?</span>
                    </div>
                    <p className="text-orange-600">
                      Choose a subscription plan to unlock all wellness features and start your
                      transformation journey.
                    </p>
                  </div>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-[#76d2fa] to-[#876aff] hover:from-[#6bc8f0] hover:to-[#7c61ff] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => (window.location.href = "/pricing")}
                  >
                    🚀 Choose Your Plan
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <div className="bg-gradient-to-r from-[#76d2fa] to-[#876aff] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Payment History</h2>
                {billingHistory.length > 0 && (
                  <p className="text-white/80 text-sm">
                    {billingHistory.length} transaction{billingHistory.length !== 1 ? "s" : ""}{" "}
                    found
                  </p>
                )}
                {isTrialActiveAndValid && billingHistory.length === 0 && (
                  <p className="text-white/80 text-sm">Currently on free trial - no payments yet</p>
                )}
              </div>
            </div>
            {billingHistory.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-white/80">Total Paid</p>
                <p className="text-xl font-bold">
                  ₹
                  {billingHistory
                    .filter((bill) => bill.formattedStatus === "Successful")
                    .reduce((sum, bill) => sum + bill.amount, 0)
                    .toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
          <p className="text-white/80 mt-2">
            {isTrialActiveAndValid
              ? "Track your payments once you subscribe to a plan"
              : "Track all your subscription payments and transactions"}
          </p>
        </div>

        <div className="p-8">
          {loadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : billingHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Show recent 3 bills or all bills based on showAllBills state */}
              {(showAllBills ? billingHistory : billingHistory.slice(0, 3)).map((bill, index) => (
                <div
                  key={bill.id}
                  className={`group p-6 border-2 border-gray-100 rounded-2xl hover:border-[#876aff]/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50 ${
                    !showAllBills && index < 3
                      ? "animate-in slide-in-from-top-4 duration-300"
                      : showAllBills && index >= 3
                        ? "animate-in slide-in-from-bottom-4 duration-300"
                        : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          bill.formattedStatus === "Successful"
                            ? "bg-green-100"
                            : bill.formattedStatus === "Failed"
                              ? "bg-red-100"
                              : bill.formattedStatus === "Pending"
                                ? "bg-yellow-100"
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
                          <span className="text-xs text-gray-400">•</span>
                          <span className="font-mono text-xs text-gray-500">
                            {bill.razorpayPaymentId.slice(0, 12)}...
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
                              : bill.formattedStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bill.formattedStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show/Hide toggle button when there are more than 3 bills */}
              {billingHistory.length > 3 && (
                <div className="pt-6 text-center border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="text-sm text-gray-500 font-medium">
                      {showAllBills
                        ? "Showing all transactions"
                        : `Showing recent 3 of ${billingHistory.length} transactions`}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>
                  <Button
                    variant="outline"
                    className="border-2 border-[#876aff]/20 text-[#876aff] hover:bg-[#876aff] hover:text-white font-semibold rounded-xl transition-all duration-300 px-6 py-3"
                    onClick={() => setShowAllBills(!showAllBills)}
                  >
                    {showAllBills ? (
                      <>
                        📈 Show Recent Only
                        <span className="ml-2 transition-transform duration-300">↑</span>
                      </>
                    ) : (
                      <>
                        📊 View All Transactions (+{billingHistory.length - 3} more)
                        <span className="ml-2 transition-transform duration-300">↓</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-[#876aff]/10 to-[#76d2fa]/10 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-400" />
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
              <Button
                className={`mt-4 font-semibold rounded-xl px-8 py-3 shadow-lg transition-all duration-300 ${
                  isTrialActiveAndValid
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-[#876aff] to-[#76d2fa] hover:from-[#7c61ff] hover:to-[#6bc8f0] text-white hover:shadow-xl"
                }`}
                onClick={
                  isTrialActiveAndValid ? undefined : () => (window.location.href = "/pricing")
                }
                disabled={isTrialActiveAndValid || false}
                title={
                  isTrialActiveAndValid
                    ? "You cannot purchase a plan during your trial period. Please wait until your trial ends to subscribe."
                    : undefined
                }
              >
                {isTrialActiveAndValid
                  ? "🔒 Purchase Available After Trial"
                  : "Start Your Subscription"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={async () => {
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
              toast.info(
                result.details?.message ||
                  "Your subscription is already scheduled for cancellation at the end of the billing period."
              );
              setShowCancelDialog(false);
              return;
            }

            toast.success(
              result.details?.message ||
                "Your subscription has been scheduled for cancellation at the end of the billing period."
            );

            // Refresh subscription data to update UI
            await refreshSubscriptionData?.();
            setShowCancelDialog(false);
          } catch (error) {
            console.error("Error during cancellation:", error);
            toast.error("Failed to cancel subscription. Please try again.");
          }
        }}
        isLoading={cancellingSubscription || false}
        userDetails={userDetails}
      />
    </div>
  );
};
