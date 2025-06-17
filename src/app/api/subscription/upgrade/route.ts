import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { NextRequest } from 'next/server';
import Razorpay from "razorpay";
import {   calculateUpgradePrice, 
  getUserSubscription, 
  updateUserSubscription,
  getPlanPricing,
  getPlanIds,
  type SubscriptionPlan
} from "@/lib/subscriptions";
import type { BillingPeriod } from "@/lib/types";
import type { Subscriptions } from "razorpay/dist/types/subscriptions";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Helper function for error responses
function errorResponse(message: string, code: string, status = 400) {
  return Response.json(
    { success: false, error: message, code },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return errorResponse('Not authenticated', 'UNAUTHORIZED', 401);
    }

    const data = await req.json();
    const { newPlan, billingPeriod } = data;

    // Function to check if a string is a valid billing period
    function isValidBillingPeriod(period: string | null | undefined): period is BillingPeriod {
      return period === "monthly" || period === "annual";
    }

    // Get the final billing period, defaulting to monthly if invalid
    const finalBillingPeriod = isValidBillingPeriod(billingPeriod) ? billingPeriod : "monthly";

    // Get current subscription details
    const subscriptionResult = await getUserSubscription(session.user.id);
    if (!subscriptionResult.success || !subscriptionResult.subscription) {
      return errorResponse(
        subscriptionResult.error || 'Subscription not found',
        'SUBSCRIPTION_NOT_FOUND',
        400
      );
    }

    const currentSubscription = subscriptionResult.subscription;
    const currentPlan = currentSubscription.subscriptionPlan || null; // Handle null subscription plans

    // For users with no current plan, treat as a new subscription
    if (!currentPlan) {      // Get the plan ID from our plan IDs configuration
      const planIds = await getPlanIds();
      const planId = planIds[newPlan.toUpperCase() as keyof typeof planIds]?.[finalBillingPeriod];

      if (!planId) {
        return errorResponse(
          'Plan configuration not found',
          'PLAN_CONFIG_NOT_FOUND',
          400
        );
      }

      try {
        // Create subscription with selected plan
        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          customer_notify: true,
          total_count: finalBillingPeriod === 'annual' ? 12 : 1,
          expire_by: Math.floor(Date.now() / 1000) + (finalBillingPeriod === 'annual' ? 31536000 : 2592000),
          notes: {
            userId: session.user.id,
            plan: newPlan,
            billingPeriod: finalBillingPeriod,
            type: "new_subscription"
          }
        });

        // Update user's subscription in database
        await updateUserSubscription({
          userId: session.user.id,
          subscriptionPlan: newPlan as SubscriptionPlan,
          billingPeriod: finalBillingPeriod,
          razorpaySubscriptionId: subscription.id,
          autoRenewal: true
        });

        return Response.json({
          success: true,
          subscription,
          priceDetails: {
            upgradePrice: 0,
            orderId: null,
            isPlanSwitch: false,
            subscriptionId: subscription.id
          }
        });
      } catch (error) {
        console.error('Error creating new subscription:', error);
        return errorResponse(
          'Failed to create subscription',
          'SUBSCRIPTION_CREATE_FAILED',
          500
        );
      }
    }

    // For existing subscriptions, validate dates
    if (!currentSubscription.subscriptionStartDate) {
      return errorResponse(
        'Invalid subscription start date',
        'INVALID_START_DATE',
        400
      );
    }

    // Get plan hierarchy to determine if it's a plan switch or upgrade
    const planHierarchy = {
      "SEED": 0,
      "BLOOM": 0,
      "FLOURISH": 1
    } as const;

    type PlanKey = keyof typeof planHierarchy;
    
    // Type guard to check if a string is a valid plan key
    function isPlanKey(plan: string): plan is PlanKey {
      return plan in planHierarchy;
    }

    // Validate plan keys
    if (!isPlanKey(currentSubscription.subscriptionPlan) || !isPlanKey(newPlan)) {
      return errorResponse(
        'Invalid plan type',
        'INVALID_PLAN',
        400
      );
    }

    // If plans are on same tier (SEED <-> BLOOM), treat as a plan switch
    const isSameTier = planHierarchy[currentSubscription.subscriptionPlan] === planHierarchy[newPlan];
    const isUpgradeToHigherTier = planHierarchy[newPlan] > planHierarchy[currentSubscription.subscriptionPlan];
    
    if (!isSameTier && !isUpgradeToHigherTier) {
      return errorResponse(
        'Cannot downgrade to a lower tier plan',
        'INVALID_UPGRADE_PATH',
        400
      );
    }

    // Calculate price difference if needed
    const priceCalcResult = isSameTier 
      ? { success: true, upgradePrice: 0, isPlanSwitch: true }
      : await calculateUpgradePrice(session.user.id, newPlan as SubscriptionPlan);

    // Validate price calculation result
    if (!priceCalcResult.success || 
        (typeof priceCalcResult.upgradePrice !== 'number' && !isSameTier)) {
      return errorResponse(
        'Failed to calculate upgrade price',
        'PRICE_CALCULATION_FAILED',
        400
      );
    }

    // Now we know we have a valid price calculation
    const priceCalculation = {
      success: true as const,
      upgradePrice: isSameTier ? 0 : (priceCalcResult.upgradePrice || 0),
      isPlanSwitch: isSameTier
    };

    try {
      let subscriptionResponse: Subscriptions.RazorpaySubscription | null = null;
      let orderResponse = null;

      // Get the plan ID for the new subscription
      const planIdKey = `${newPlan.toUpperCase()}_${finalBillingPeriod.toUpperCase()}_PLAN_ID`;
      const planId = process.env[planIdKey];

      if (!planId) {
        return errorResponse(
          'Plan configuration not found',
          'PLAN_CONFIG_NOT_FOUND',
          400
        );
      }

      // Create new subscription
      subscriptionResponse = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: true,
        total_count: finalBillingPeriod === 'annual' ? 12 : 1,
        expire_by: Math.floor(Date.now() / 1000) + (finalBillingPeriod === 'annual' ? 31536000 : 2592000),
        notes: {
          userId: session.user.id,
          previousPlan: currentSubscription.subscriptionPlan,
          newPlan: newPlan,
          billingPeriod: finalBillingPeriod,
          type: isSameTier ? "plan_switch" : "upgrade"
        }
      });

      // If there's a price difference, create an order
      if (priceCalculation.upgradePrice > 0) {
        orderResponse = await razorpay.orders.create({
          amount: Math.round(priceCalculation.upgradePrice * 100), // Convert to paisa
          currency: "INR",
          receipt: `upgrade_${session.user.id}_${Date.now()}`,
          notes: {
            userId: session.user.id,
            previousPlan: currentSubscription.subscriptionPlan,
            newPlan: newPlan,
            billingPeriod: finalBillingPeriod,
            subscriptionId: subscriptionResponse.id,
            type: "upgrade_payment"
          }
        });
      }

      // Update user's subscription in database
      await updateUserSubscription({
        userId: session.user.id,
        subscriptionPlan: newPlan as SubscriptionPlan,
        billingPeriod: finalBillingPeriod,
        razorpaySubscriptionId: subscriptionResponse.id,
        autoRenewal: true
      });

      return Response.json({
        success: true,
        subscription: subscriptionResponse,
        priceDetails: {
          upgradePrice: priceCalculation.upgradePrice,
          orderId: orderResponse?.id || null,
          isPlanSwitch: priceCalculation.isPlanSwitch || false,
          subscriptionId: subscriptionResponse.id
        }
      });
    } catch (error) {
      console.error('Error processing upgrade:', error);
      return errorResponse(
        'Failed to process upgrade',
        'UPGRADE_FAILED',
        500
      );
    }
  } catch (error) {
    console.error('Error in upgrade route:', error);
    return errorResponse(
      'Internal server error',
      'SERVER_ERROR',
      500
    );
  }
}