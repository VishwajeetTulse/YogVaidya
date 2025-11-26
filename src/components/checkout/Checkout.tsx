"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import verify from "@/lib/rzp/verify";
import {
  Check,
  Crown,
  Sparkles,
  IndianRupeeIcon,
  Shield,
  Clock,
  Users,
  Star,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      icon: <Star className="w-6 h-6" />,
      bgColor: "bg-sky-50",
      textColor: "text-sky-700",
      borderColor: "border-sky-200",
      accentColor: "bg-sky-600",
      features: [
        "Live meditation sessions",
        "Basic meditation guides",
        "Online support",
        "Guided relaxation techniques",
        "Progress tracking",
        "Community access",
      ],
      benefits: [
        { icon: <Users className="w-4 h-4" />, text: "Group meditation sessions" },
        { icon: <Clock className="w-4 h-4" />, text: "Flexible scheduling" },
        { icon: <Shield className="w-4 h-4" />, text: "Cancel anytime" },
      ],
    },
    bloom: {
      name: "Bloom",
      price: 1999,
      originalPrice: 1999,
      description: "Most popular plan for your wellness journey",
      icon: <Crown className="w-6 h-6" />,
      bgColor: "bg-violet-50",
      textColor: "text-violet-700",
      borderColor: "border-violet-200",
      accentColor: "bg-violet-600",
      features: [
        "Live yoga sessions (General)",
        "Generalized diet plans",
        "Chat with AI assistant",
        "Meditation sessions (Coming soon)",
        "Progress tracking",
        "Community access",
      ],
      benefits: [
        { icon: <Users className="w-4 h-4" />, text: "Join group sessions" },
        { icon: <Clock className="w-4 h-4" />, text: "Flexible scheduling" },
        { icon: <Shield className="w-4 h-4" />, text: "Cancel anytime" },
      ],
    },
    flourish: {
      name: "Flourish",
      price: 4999,
      originalPrice: 4999,
      description: "Perfect for personalized wellness needs",
      icon: <Sparkles className="w-6 h-6" />,
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
      borderColor: "border-pink-200",
      accentColor: "bg-pink-600",
      features: [
        "Live yoga sessions (Individual)",
        "Personalized diet plans",
        "Chat with AI assistant",
        "Meditation sessions (Coming soon)",
        "1-on-1 mentor consultations",
        "Premium support",
      ],
      benefits: [
        { icon: <Users className="w-4 h-4" />, text: "Personal trainer" },
        { icon: <Clock className="w-4 h-4" />, text: "Priority scheduling" },
        { icon: <Shield className="w-4 h-4" />, text: "Full support" },
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
          color: "#0F172A",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                Complete Your Subscription
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                You&apos;re just one step away from starting your wellness journey with Yoga Vaidya
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Plan Details Card */}
            <div className="md:col-span-5">
              <Card
                className={`sticky top-8 border-2 ${selectedPlan.borderColor} ${selectedPlan.bgColor}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full bg-white shadow-sm ${selectedPlan.textColor}`}
                    >
                      {selectedPlan.icon}
                    </div>
                    <div>
                      <CardTitle className={`text-xl ${selectedPlan.textColor}`}>
                        {selectedPlan.name} Plan
                      </CardTitle>
                      <CardDescription className="text-muted-foreground/80">
                        {selectedPlan.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Billing Toggle */}
                  <div className="bg-white/50 p-1 rounded-lg flex">
                    <button
                      onClick={() => setBillingPeriod("monthly")}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        billingPeriod === "monthly"
                          ? "bg-white shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod("annual")}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        billingPeriod === "annual"
                          ? "bg-white shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Annual
                      <span className="ml-1 text-xs text-green-600 font-bold">-20%</span>
                    </button>
                  </div>

                  {/* Price Display */}
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupeeIcon className={`w-6 h-6 ${selectedPlan.textColor}`} />
                      <span className={`text-4xl font-bold ${selectedPlan.textColor}`}>
                        {applyDiscount(selectedPlan.price)}
                      </span>
                      <span className="text-muted-foreground self-end mb-1">
                        /{billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {billingPeriod === "annual" && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        You save ₹{selectedPlan.price - applyDiscount(selectedPlan.price)} per year!
                      </p>
                    )}
                  </div>

                  <Separator className="bg-black/5" />

                  {/* Features List */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      What&apos;s included
                    </h3>
                    <ul className="space-y-3">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <Check className={`h-5 w-5 ${selectedPlan.textColor} flex-shrink-0`} />
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout Form */}
            <div className="md:col-span-7">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                  <CardDescription>Review your order details before proceeding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className={`font-medium ${selectedPlan.textColor}`}>
                        {selectedPlan.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Billing Cycle</span>
                      <span className="font-medium capitalize">{billingPeriod}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>

                    {billingPeriod === "annual" && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Annual Discount (20%)</span>
                        <span>-₹{selectedPlan.price - applyDiscount(selectedPlan.price)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold flex items-center">
                        <IndianRupeeIcon className="w-5 h-5" />
                        {applyDiscount(selectedPlan.price)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-4 space-y-3 ${selectedPlan.bgColor} border ${selectedPlan.borderColor}`}
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Secure SSL Encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Cancel anytime from your dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>Instant access to premium features</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className={`w-full h-12 text-lg ${selectedPlan.accentColor} hover:opacity-90 transition-opacity`}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay Securely <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By confirming your subscription, you allow Yoga Vaidya to charge your card for
                    future payments in accordance with our terms.
                  </p>
                </CardFooter>
              </Card>
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
