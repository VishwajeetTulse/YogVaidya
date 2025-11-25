"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import verify from "@/lib/rzp/verify";
import { Check, Crown, Sparkles, IndianRupeeIcon, Shield, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";
import { createUserSubscription } from "@/lib/subscriptions";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface RazorpayResponse {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function Checkout({ plan }: { plan: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Apply discount for annual billing
  const applyDiscount = (price: number) => {
    if (billingPeriod === "annual") {
      return Math.round(price * 0.8); // 20% discount for annual billing
    }
    return price;
  };

  const planDetails = {
    seed: {
      name: "Seed",
      price: 1999,
      originalPrice: 1999,
      description: "Perfect for meditation enthusiasts",
      gradient: "from-[#76d2fa] to-[#5a9be9]",
      textColor: "text-[#5a9be9]",
      bgColor: "bg-[#5a9be9]",
      icon: <Star className="w-8 h-8 text-white" />,
      features: [
        "Live meditation sessions",
        "Basic meditation guides",
        "Online support",
        "Guided relaxation techniques",
        "Progress tracking",
        "Community access",
      ],
      benefits: [
        { icon: <Users className="w-5 h-5" />, text: "Group meditation sessions" },
        { icon: <Clock className="w-5 h-5" />, text: "Flexible scheduling" },
        { icon: <Shield className="w-5 h-5" />, text: "Cancel anytime" },
      ],
    },
    bloom: {
      name: "Bloom",
      price: 1999,
      originalPrice: 1999,
      description: "Most popular plan for your wellness journey",
      gradient: "from-[#CDC1FF] to-[#876aff]",
      textColor: "text-[#876aff]",
      bgColor: "bg-[#876aff]",
      icon: <Crown className="w-8 h-8 text-white" />,
      features: [
        "Live yoga sessions (General)",
        "Generalized diet plans",
        "Chat with AI assistant",
        "Meditation sessions (Coming soon)",
        "Progress tracking",
        "Community access",
      ],
      benefits: [
        { icon: <Users className="w-5 h-5" />, text: "Join group sessions" },
        { icon: <Clock className="w-5 h-5" />, text: "Flexible scheduling" },
        { icon: <Shield className="w-5 h-5" />, text: "Cancel anytime" },
      ],
    },
    flourish: {
      name: "Flourish",
      price: 4999,
      originalPrice: 4999,
      description: "Perfect for personalized wellness needs",
      gradient: "from-[#ffa6c5] to-[#ff7dac]",
      textColor: "text-[#ff7dac]",
      bgColor: "bg-[#ff7dac]",
      icon: <Sparkles className="w-8 h-8 text-white" />,
      features: [
        "Live yoga sessions (Individual)",
        "Personalized diet plans",
        "Chat with AI assistant",
        "Meditation sessions (Coming soon)",
        "1-on-1 mentor consultations",
        "Premium support",
      ],
      benefits: [
        { icon: <Users className="w-5 h-5" />, text: "Personal trainer" },
        { icon: <Clock className="w-5 h-5" />, text: "Priority scheduling" },
        { icon: <Shield className="w-5 h-5" />, text: "Full support" },
      ],
    },
  };
  const selectedPlan = planDetails[plan as keyof typeof planDetails]; // Redirect if plan not found
  useEffect(() => {
    if (!selectedPlan) {
      router.push("/dashboard/plans");
    }
  }, [selectedPlan, plan, router]);

  // Note: Authentication check is handled server-side in the page component
  // No need for client-side redirect as server already ensures user is authenticated
  const handleCheckout = async () => {
    // Check if user is authenticated before proceeding
    if (!session?.user?.id) {
      toast.error("Please sign in to complete your purchase.");
      router.push("/signin");
      return;
    }

    // Check if Razorpay script is loaded
    if (!razorpayLoaded || typeof window.Razorpay === "undefined") {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: plan,
          billingPeriod: billingPeriod,
          amount: applyDiscount(selectedPlan.price),
        }),
      });

      const data = await response.json();

      // Check if API response is successful
      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to create subscription");
      }

      const subscription = data.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscription.id,
        name: "Yoga Vaidya",
        description: `${selectedPlan.name} Plan Subscription`,
        handler: async function (response: RazorpayResponse) {
          try {
            if (
              !(await verify(
                response.razorpay_subscription_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              ))
            ) {
              throw new Error("Payment verification failed");
            }

            // Payment verified successfully - now update user subscription in database
            if (!session?.user?.id) {
              throw new Error("User session not found");
            }

            // Create/update subscription using server action
            const subscriptionResult = await createUserSubscription({
              userId: session.user.id,
              subscriptionPlan: plan.toUpperCase() as "SEED" | "BLOOM" | "FLOURISH",
              billingPeriod: billingPeriod,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpayCustomerId: subscription.customer_id,
              paymentAmount: applyDiscount(selectedPlan.price),
              autoRenewal: true,
            });

            if (!subscriptionResult.success) {
              console.error("Subscription update failed:", subscriptionResult.error);
              // Still redirect to dashboard even if subscription update fails
              // User can contact support for subscription issues
              toast.error(
                "Payment successful but subscription update failed. Please contact support."
              );
            }

            // Success - redirect to dashboard with success message
            router.push("/dashboard?payment=success");
          } catch (error) {
            console.error("Payment processing error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: session?.user?.name || "User",
          email: session?.user?.email || "user@example.com",
        },
        theme: {
          color: selectedPlan.bgColor.replace("bg-[", "").replace("]", ""),
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: RazorpayResponse) {
        toast.error("Payment failed. Please try again.");
        console.error("Payment failed:", response);
      });
      razorpay.open();
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return <div>Loading...</div>;
  }

  // Show loading while session is being fetched
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4 mr-2" />
              Secure Checkout
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Complete Your Subscription
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              You&apos;re just one step away from starting your wellness journey with Yoga Vaidya
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Plan Details Card */}
            <div
              className={`bg-gradient-to-b ${selectedPlan.gradient} rounded-3xl overflow-hidden shadow-2xl`}
            >
              <div className="p-8 text-white">
                {/* Plan Header */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    {selectedPlan.icon}
                  </div>
                  <div>
                    <span className="text-sm font-semibold bg-white/20 px-4 py-1 rounded-full uppercase">
                      {selectedPlan.name}
                    </span>
                    <p className="text-white/90 mt-2">{selectedPlan.description}</p>
                  </div>
                </div>

                {/* Billing Toggle */}
                <div className="mb-6">
                  <div className="inline-flex items-center bg-white/20 p-1 rounded-full">
                    <button
                      onClick={() => setBillingPeriod("monthly")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        billingPeriod === "monthly"
                          ? "bg-white text-gray-800 shadow-md"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod("annual")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        billingPeriod === "annual"
                          ? "bg-white text-gray-800 shadow-md"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      Annual
                    </button>
                  </div>
                  {billingPeriod === "annual" && (
                    <div className="mt-2 text-white/90 text-sm font-medium">
                      🎉 Save 20% with annual billing!
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end mb-2">
                    <span className="text-5xl font-bold flex items-center">
                      <IndianRupeeIcon className="w-8 h-8" />
                      {applyDiscount(selectedPlan.price)}
                    </span>
                    <span className="text-white/70 ml-2 mb-1">
                      / {billingPeriod === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingPeriod === "annual" && selectedPlan.price > 0 && (
                    <p className="text-white/80 text-sm">
                      <span className="line-through">₹{selectedPlan.price}</span> - You save ₹
                      {selectedPlan.price - applyDiscount(selectedPlan.price)} per billing period
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <h3 className="text-lg font-semibold mb-4">What&apos;s included:</h3>
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-4">Key benefits:</h3>
                  {selectedPlan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center">
                      <div className="text-white/80 mr-3">{benefit.icon}</div>
                      <span className="text-white/90">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Summary</h2>

              {/* Order Summary */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-semibold capitalize">{billingPeriod}</span>
                </div>
                {billingPeriod === "annual" && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Discount (20%)</span>
                    <span className="font-semibold text-green-600">
                      -₹{selectedPlan.price - applyDiscount(selectedPlan.price)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-4 bg-gray-50 px-4 rounded-lg">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-gray-800 flex items-center">
                    <IndianRupeeIcon className="w-6 h-6" />
                    {applyDiscount(selectedPlan.price)}
                  </span>
                </div>
              </div>

              {/* Security badges */}
              <div className="flex items-center justify-center space-x-6 mb-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-500" />
                  Secure Payment
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Cancel Anytime
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${selectedPlan.bgColor} hover:opacity-90 text-white shadow-lg hover:shadow-xl`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Complete Secure Payment
                  </>
                )}
              </Button>

              {/* Footer note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Your subscription will auto-renew unless cancelled.
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                256-bit SSL Encryption
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Money-back Guarantee
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-green-500" />
                24/7 Customer Support
              </div>
            </div>
          </div>
        </div>
      </div>

      <Script 
        id="razorpay-checkout-js" 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => toast.error("Failed to load payment system. Please refresh the page.")}
      />
    </>
  );
}
