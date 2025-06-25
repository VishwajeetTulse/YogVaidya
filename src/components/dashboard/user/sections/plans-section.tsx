import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Star,
  Crown,
  Sparkles,
  Heart,
  BookOpen,
  MessageSquare,
  PlayCircle,
  Target,
  Calendar,
  Shield,
  Check,
  IndianRupee as IndianRupeeIcon,
  Loader2,
} from "lucide-react";
import { SectionProps } from "../types";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getUserSubscription } from "@/lib/subscriptions";
import { useSession } from "@/lib/auth-client";
interface PaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  }
export const PlansSection = ({
  billingPeriod,
  setBillingPeriod,
  viewMode,
  setViewMode,
}: SectionProps) => {
  const { data: session } = useSession();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscriptionStatus: string;
    subscriptionPlan?: string;
    billingPeriod?: string;
    email?: string;
    name?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (!session?.user.id) {
          console.error("No user ID found in session");
          setIsLoading(false);
          return;
        }
        const result = await getUserSubscription(session?.user.id);
        if (result.success && result.subscription) {
          setSubscription({
            subscriptionStatus:
              result.subscription.subscriptionStatus || "INACTIVE",
            subscriptionPlan: result.subscription.subscriptionPlan || "",
            billingPeriod: result.subscription.billingPeriod!,
            email: result.subscription.email,
            name: result.subscription.name!,
          });
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Failed to load subscription details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [session?.user.id]);
  // Helper to format the next payment date
  const formatNextPaymentDate = (timestamp: string | number) => {
    console.log("Formatting timestamp:", timestamp, typeof timestamp);

    // If timestamp is a string that looks like an ISO date
    if (typeof timestamp === "string" && timestamp.includes("T")) {
      return new Date(timestamp).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // If timestamp is a Unix timestamp (either string or number)
    const unixTimestamp =
      typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
    const date = new Date(unixTimestamp * 1000);
    console.log("Converted date:", date);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (isUpgrading) return;

    if (
      !subscription?.subscriptionStatus ||
      subscription.subscriptionStatus !== "ACTIVE"
    ) {
      window.location.href = `/checkout?plan=${planId}&billing=${billingPeriod}`;
      return;
    }

    try {
      setIsUpgrading(true);

      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPlan: planId.toUpperCase(),
          billingPeriod,
        }),
      });

      const responseData = await response.json();
      console.log("Upgrade response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to process upgrade");
      }

      if (responseData.success) {
        if (
          responseData.priceDetails.requiresPayment &&
          responseData.paymentDetails
        ) {
          // For paid upgrades, initialize Razorpay payment
          const options = {
            ...responseData.paymentDetails,
            handler: async function (paymentResponse: PaymentSuccessResponse) {
              try {
                const upgradeResponse = await fetch(
                  "/api/subscription/upgrade",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      newPlan: planId.toUpperCase(),
                      billingPeriod,
                      paymentVerified: true,
                      paymentId: paymentResponse.razorpay_payment_id,
                      orderId: paymentResponse.razorpay_order_id,
                      signature: paymentResponse.razorpay_signature,
                    }),
                  }
                );

                const upgradeData = await upgradeResponse.json();
                console.log("Payment verification response:", upgradeData);

                if (upgradeData.success) {
                  const planType = planId.toUpperCase();
                  const amount =
                    upgradeData.priceDetails.paymentAmount ||
                    plans.find((p) => p.id.toUpperCase() === planType)?.price ||
                    0;
                  const formattedAmount = formatCurrency(amount);

                  console.log("Raw upgrade data:", upgradeData.priceDetails);
                  console.log(
                    "Next payment date from API:",
                    upgradeData.priceDetails.nextPaymentDate
                  );

                  let nextPaymentDate;
                  if (upgradeData.priceDetails.startDate) {
                    nextPaymentDate = formatNextPaymentDate(
                      upgradeData.priceDetails.startDate
                    );
                  } else if (upgradeData.priceDetails.nextPaymentDate) {
                    nextPaymentDate = formatNextPaymentDate(
                      upgradeData.priceDetails.nextPaymentDate
                    );
                  } else {
                    // Fallback to current date plus one billing period
                    const now = new Date();
                    now.setMonth(
                      now.getMonth() + (billingPeriod === "annual" ? 12 : 1)
                    );
                    nextPaymentDate = now.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                  }

                  const toastMessage =
                    upgradeData.priceDetails.type === "plan_switch" ? (
                      <div>
                        Your plan has been switched to{" "}
                        <strong>{planType}</strong>. Your next billing date is{" "}
                        <strong>{nextPaymentDate}</strong> when you&apos;ll need
                        to pay <strong>{formattedAmount}</strong>
                      </div>
                    ) : (
                      <div>
                        Your plan has been upgraded to{" "}
                        <strong>{planType}</strong>. The higher rate of{" "}
                        <strong>{formattedAmount}</strong> will be charged on
                        your next billing date:{" "}
                        <strong>{nextPaymentDate}</strong>
                      </div>
                    );

                  toast.success("Plan Updated Successfully", {
                    description: toastMessage,
                    duration: 6000,
                  });

                  setSubscription((prev) => ({
                    ...prev!,
                    subscriptionPlan: planType,
                    billingPeriod: billingPeriod,
                  }));
                  setIsUpgrading(false);
                } else {
                  throw new Error(
                    upgradeData.error || "Failed to upgrade plan"
                  );
                }
              } catch (error) {
                console.error("Error completing upgrade:", error);
                setIsUpgrading(false);
                toast.error("Upgrade Failed", {
                  description:
                    error instanceof Error
                      ? error.message
                      : "Failed to complete the upgrade",
                });
              }
            },
            modal: {
              ondismiss: function () {
                setIsUpgrading(false);
              },
            },
            theme: {
              color: "#876aff",
            },
          };
          // @ts-expect-error import Razorpay from cdn
          if (!window.Razorpay) {
            await loadRazorpayScript();
          }
          // @ts-expect-error import Razorpay from cdn
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // For plan switches or immediate upgrades
          const planType = planId.toUpperCase();
          const amount =
            responseData.priceDetails.paymentAmount ||
            plans.find((p) => p.id.toUpperCase() === planType)?.price ||
            0;
          const formattedAmount = formatCurrency(amount);
          console.log("Raw response data:", responseData.priceDetails);
          console.log(
            "Next payment date from API:",
            responseData.priceDetails.nextPaymentDate
          );

          let nextPaymentDate;
          if (responseData.priceDetails.startDate) {
            nextPaymentDate = formatNextPaymentDate(
              responseData.priceDetails.startDate
            );
          } else if (responseData.priceDetails.nextPaymentDate) {
            nextPaymentDate = formatNextPaymentDate(
              responseData.priceDetails.nextPaymentDate
            );
          } else {
            // Fallback to current date plus one billing period
            const now = new Date();
            now.setMonth(
              now.getMonth() + (billingPeriod === "annual" ? 12 : 1)
            );
            nextPaymentDate = now.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          }

          console.log("Formatted data:", {
            rawTimestamp: responseData.priceDetails.nextPaymentDate,
            nextPaymentDate,
            planType,
            amount,
            formattedAmount,
          });

          const toastMessage =
            responseData.priceDetails.type === "plan_switch" ? (
              <div>
                Your plan has been switched to <strong>{planType}</strong>. Your
                next billing date is <strong>{nextPaymentDate}</strong> when
                you&apos;ll need to pay <strong>{formattedAmount}</strong>
              </div>
            ) : (
              <div>
                Your plan has been upgraded to <strong>{planType}</strong>. The
                higher rate of <strong>{formattedAmount}</strong> will be
                charged on your next billing date:{" "}
                <strong>{nextPaymentDate}</strong>
              </div>
            );

          toast.success("Plan Updated Successfully", {
            description: toastMessage,
            duration: 6000,
          });

          setSubscription((prev) => ({
            ...prev!,
            subscriptionPlan: planType,
            billingPeriod: billingPeriod,
          }));
          setIsUpgrading(false);
        }
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      setIsUpgrading(false);
      toast.error("Upgrade Failed", {
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };

  // Apply discount for annual billing
  const applyDiscount = (price: number) => {
    if (billingPeriod === "annual") {
      return Math.round(price * 0.8); // 20% discount for annual billing
    }
    return price;
  };

  // Helper function to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const plans = [
    {
      id: "seed",
      name: "Seed",
      price: 1999,
      originalPrice: 0,
      description: "Perfect for meditation enthusiasts",
      gradient: "from-[#76d2fa] to-[#5a9be9]",
      textColor: "text-[#5a9be9]",
      icon: <Star className="w-7 h-7 text-white" />,
      features: [
        {
          text: "Live meditation sessions",
          icon: <Heart className="w-4 h-4" />,
        },
        {
          text: "Basic meditation guides",
          icon: <BookOpen className="w-4 h-4" />,
        },
        { text: "Online support", icon: <MessageSquare className="w-4 h-4" /> },
      ],
      isPopular: false,
      badge: "STARTER",
    },
    {
      id: "bloom",
      name: "Bloom",
      price: 1999,
      originalPrice: 1999,
      description: "Perfect for yoga enthusiasts",
      gradient: "from-[#CDC1FF] to-[#876aff]",
      textColor: "text-[#876aff]",
      icon: <Crown className="w-7 h-7 text-white" />,
      features: [
        {
          text: "Live yoga sessions",
          icon: <PlayCircle className="w-4 h-4" />,
        },
        {
          text: "Pose guidance and corrections",
          icon: <Target className="w-4 h-4" />,
        },
        { text: "Online Support", icon: <MessageSquare className="w-4 h-4" /> },
      ],
      isPopular: true,
      badge: "MOST POPULAR",
    },
    {
      id: "flourish",
      name: "Flourish",
      price: 4999,
      originalPrice: 4999,
      description: "Complete wellness journey",
      gradient: "from-[#ffa6c5] to-[#ff7dac]",
      textColor: "text-[#ff7dac]",
      icon: <Sparkles className="w-7 h-7 text-white" />,
      features: [
        {
          text: "Live yoga sessions",
          icon: <PlayCircle className="w-4 h-4" />,
        },
        {
          text: "Live meditation sessions",
          icon: <Heart className="w-4 h-4" />,
        },
        {
          text: "Personalized diet plan",
          icon: <Calendar className="w-4 h-4" />,
        },
        { text: "Priority support", icon: <Shield className="w-4 h-4" /> },
      ],
      isPopular: false,
      badge: "PREMIUM",
    },
  ];

  console.log("subscription:", subscription);
  console.log("user id:", session?.user.id);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upgrade Plans</h1>
            <p className="text-gray-600 mt-2">
              Choose the perfect plan for your wellness journey.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode?.("cards")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  viewMode === "cards"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Card View
              </button>
              <button
                onClick={() => setViewMode?.("comparison")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  viewMode === "comparison"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Compare Plans
              </button>
            </div>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-gray-200 p-1 rounded-full">
              <button
                onClick={() => setBillingPeriod?.("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "monthly"
                    ? "bg-[#76d2fa] text-white shadow-md"
                    : "bg-transparent text-gray-600 hover:bg-gray-300/50"
                }`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setBillingPeriod?.("annual")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "annual"
                    ? "bg-[#76d2fa] text-white shadow-md"
                    : "bg-transparent text-gray-600 hover:bg-gray-300/50"
                }`}
              >
                ANNUAL
              </button>
            </div>
          </div>

          {billingPeriod === "annual" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Save 20% with annual billing
              </div>
            </div>
          )}

          {/* Plans Content */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-gradient-to-b ${
                    plan.gradient
                  } rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] h-full relative ${
                    plan.isPopular
                      ? "transform md:scale-105 z-10 ring-4 ring-white/50"
                      : ""
                  }`}
                >
                  <div className="p-8 flex flex-col h-full">
                    {/* Plan header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            {plan.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {plan.name}
                            </h3>
                            <span className="text-xs font-medium bg-white/20 text-white px-3 py-1 rounded-full uppercase">
                              {plan.badge}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/90 text-sm">
                        {plan.description}
                      </p>
                    </div>
                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-end mb-2">
                        <span className="text-4xl font-bold text-white flex items-center">
                          <IndianRupeeIcon className="w-6 h-6" />
                          {applyDiscount(plan.price)}
                        </span>
                        <span className="text-white/70 ml-2 mb-1 text-sm">
                          / month
                        </span>
                      </div>
                      {billingPeriod === "annual" && plan.price > 0 && (
                        <div className="text-white/80 text-sm">
                          <span className="line-through">₹{plan.price}</span>
                          <span className="ml-2 bg-green-500/20 text-green-100 px-2 py-1 rounded text-xs">
                            Save 20%
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Features */}
                    <div className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-5 h-5 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            {feature.icon}
                          </div>
                          <span className="text-white text-sm">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Button */}{" "}
                    {plan.price === 0 ? (
                      <Link href="/dashboard" passHref>
                        <Button
                          className={`mt-auto w-full py-4 rounded-xl bg-white ${plan.textColor} hover:bg-white/90 transition-all duration-300 font-semibold text-base`}
                        >
                          GET STARTED FREE
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className={`mt-auto w-full py-4 rounded-xl bg-white ${plan.textColor} hover:bg-white/90 transition-all duration-300 font-semibold text-base`}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isUpgrading}
                      >
                        {isUpgrading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            UPGRADING...
                          </>
                        ) : (
                          "UPGRADE NOW"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Comparison Table View
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="text-left p-6 font-semibold text-gray-900">
                        Features
                      </th>
                      {plans.map((plan) => (
                        <th
                          key={plan.id}
                          className="text-center p-6 min-w-[200px]"
                        >
                          <div className="space-y-2">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto`}
                            >
                              {plan.icon}
                            </div>
                            <h3 className="font-bold text-gray-900">
                              {plan.name}
                            </h3>
                            <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                              <IndianRupeeIcon className="w-5 h-5" />
                              {applyDiscount(plan.price)}
                              <span className="text-sm text-gray-500 ml-1">
                                / month
                              </span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Extract all unique features */}
                    {Array.from(
                      new Set(
                        plans.flatMap((plan) =>
                          plan.features.map((f) => f.text)
                        )
                      )
                    ).map((featureText, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                        }
                      >
                        <td className="p-4 font-medium text-gray-900">
                          {featureText}
                        </td>
                        {plans.map((plan) => (
                          <td key={plan.id} className="p-4 text-center">
                            {plan.features.some(
                              (f) => f.text === featureText
                            ) ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="p-6 font-semibold text-gray-900">
                        Choose Plan
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="p-6 text-center">
                          {" "}
                          {plan.price === 0 ? (
                            <Link href="/dashboard" passHref>
                              <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                                GET STARTED
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              className={`w-full bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90`}
                              onClick={() => handleUpgrade(plan.id)}
                              disabled={isUpgrading}
                            >
                              {isUpgrading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  UPGRADING...
                                </>
                              ) : (
                                "UPGRADE"
                              )}
                            </Button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
