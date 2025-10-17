// create a razorpay instance and export it
import { type NextRequest } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/config/auth";
import type { Subscriptions } from "razorpay/dist/types/subscriptions";
import type { BillingPeriod } from "@/lib/types";
import { AuthenticationError, ValidationError } from "@/lib/utils/error-handler";
import { successResponse, errorResponse } from "@/lib/utils/response-handler";
import { getPlanIds } from "@/lib/subscriptions";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      throw new AuthenticationError("User session not found");
    }
    const { plan = "bloom", billingPeriod = "monthly" } = await req.json();

    // Validate plan and billing period
    if (!plan || !["seed", "bloom", "flourish"].includes(plan)) {
      throw new ValidationError("Invalid plan selected");
    }

    if (!["monthly", "annual"].includes(billingPeriod)) {
      throw new ValidationError("Invalid billing period");
    }

    const planIds = await getPlanIds();
    const planId =
      planIds[plan.toUpperCase() as keyof typeof planIds]?.[billingPeriod as BillingPeriod];

    if (!planId) {
      throw new ValidationError("Plan configuration not found");
    }

    const subscription: Subscriptions.RazorpaySubscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: true,
      total_count: 12,
      expire_by: Math.floor(Date.now() / 1000) + 31536000, // 1 year or 30 days
      notes: {
        plan_type: plan,
        billing_period: billingPeriod,
        user_id: session.user.id,
      },
    });

    return successResponse(
      subscription,
      200,
      "Subscription created successfully"
    );
  } catch (error) {
    return errorResponse(error);
  }
}
