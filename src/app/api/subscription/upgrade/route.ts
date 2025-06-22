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

// Validate environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Missing required Razorpay environment variables');
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
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
    console.log('Received request data:', data);
    const { newPlan, billingPeriod } = data;

    // Validate required fields
    if (!newPlan || typeof newPlan !== 'string') {
      return errorResponse('Invalid or missing plan', 'INVALID_PLAN', 400);
    }

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

    console.log('Current subscription:', subscriptionResult.subscription);
    const currentSubscription = subscriptionResult.subscription;

    // Get plan hierarchy to determine if it's a plan switch or upgrade
    const planHierarchy = {
      "SEED": 0,
      "BLOOM": 0,
      "FLOURISH": 1
    } as const;

    type PlanKey = keyof typeof planHierarchy;
    
    // Type guard to check if a string is a valid plan key
    function isPlanKey(plan: string | null): plan is PlanKey {
      return typeof plan === 'string' && plan in planHierarchy;
    }

    // Validate plan keys
    if (!currentSubscription.subscriptionPlan || !isPlanKey(currentSubscription.subscriptionPlan) || !isPlanKey(newPlan)) {
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

    try {
      const planIds = await getPlanIds();
      const planId = planIds[newPlan.toUpperCase() as keyof typeof planIds]?.[finalBillingPeriod];

      if (!planId) {
        return errorResponse(
          'Plan configuration not found',
          'PLAN_CONFIG_NOT_FOUND',
          400
        );
      }

      console.log('Using plan ID:', planId);

      // Calculate price and equivalent days for the new plan
      const priceCalcResult = isSameTier 
        ? { success: true, upgradePrice: 0, isPlanSwitch: true, equivalentDaysInNewPlan: 0 }
        : await calculateUpgradePrice(session.user.id, newPlan as SubscriptionPlan);

      console.log('Price calculation result:', priceCalcResult);

      if (!priceCalcResult.success) {
        return errorResponse(
          'Failed to calculate upgrade details',
          'CALCULATION_FAILED',
          400
        );
      }

      // Get current subscription details from Razorpay
      let currentRazorpaySubscription = null;
      let nextBillingDate = null;

      if (currentSubscription.razorpaySubscriptionId) {
        try {
          currentRazorpaySubscription = await razorpay.subscriptions.fetch(currentSubscription.razorpaySubscriptionId);
          console.log('Current Razorpay subscription:', currentRazorpaySubscription);

          // Calculate next billing date
          if (currentRazorpaySubscription.current_start && currentRazorpaySubscription.current_end) {
            nextBillingDate = currentRazorpaySubscription.current_end;
            
            // If we're close to the current_end (within 1 hour), use the next cycle
            const now = Math.floor(Date.now() / 1000);
            if (nextBillingDate - now < 3600) { // less than 1 hour until current_end
              const cycleLength = currentRazorpaySubscription.current_end - currentRazorpaySubscription.current_start;
              nextBillingDate += cycleLength;
            }
          }
        } catch (error) {
          console.warn('Error fetching current subscription:', error);
        }
      }      // Calculate start time based on plan type
      const now = Math.floor(Date.now() / 1000);
      let startAt;

      if (isSameTier) {
        // For plan switches (SEED <-> BLOOM), use the current subscription's billing date
        startAt = nextBillingDate || currentRazorpaySubscription?.current_end || now;
        console.log('Plan switch: Using current billing date:', new Date(startAt * 1000).toISOString());
      } else {
        // For upgrades to higher tier, use calculated equivalent days
        const equivalentSeconds = (priceCalcResult.equivalentDaysInNewPlan || 0) * 24 * 60 * 60;
        startAt = now + equivalentSeconds;
        console.log('Plan upgrade: Using calculated start date:', new Date(startAt * 1000).toISOString());
      }

      // Create new subscription with calculated start time
      console.log('Creating new subscription with plan:', planId);
      const subscriptionCreateParams = {
        plan_id: planId,
        customer_notify: true,
        quantity: 1,
        total_count: 12,
        addons: [],
        start_at: startAt,
        notes: {
          userId: session.user.id,
          previousPlan: currentSubscription.subscriptionPlan,
          newPlan: newPlan,
          billingPeriod: finalBillingPeriod,
          type: isSameTier ? "plan_switch" : "upgrade",
          previousSubscriptionId: currentSubscription.razorpaySubscriptionId || null,
          equivalentDaysInNewPlan: priceCalcResult.equivalentDaysInNewPlan?.toString() || "0"
        }
      };

      console.log('Creating subscription with params:', subscriptionCreateParams);      
      const newSubscription = await razorpay.subscriptions.create(subscriptionCreateParams) as any;
      console.log('Created new subscription:', newSubscription);

      // Cancel the old subscription at the end of the current billing cycle
      if (currentSubscription.razorpaySubscriptionId && newSubscription) {
        try {
          console.log('Scheduling old subscription cancellation at cycle end');
          // Schedule cancellation at cycle end by passing true
          await razorpay.subscriptions.cancel(currentSubscription.razorpaySubscriptionId, true);
        } catch (error) {
          console.warn('Error cancelling existing subscription:', error);
        }
      }

      // Update user's subscription in database
      console.log('Updating subscription in database');
      await updateUserSubscription({
        userId: session.user.id,
        subscriptionPlan: newPlan as SubscriptionPlan,
        billingPeriod: finalBillingPeriod,
        razorpaySubscriptionId: newSubscription?.id,
        autoRenewal: true
      });

      return Response.json({
        success: true,
        subscription: newSubscription,
        priceDetails: {
          isPlanSwitch: isSameTier,
          subscriptionId: newSubscription?.id,
          nextBillingDate: nextBillingDate || newSubscription?.start_at,
          startDate: new Date((nextBillingDate || newSubscription?.start_at || Math.floor(Date.now() / 1000)) * 1000).toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error processing upgrade:', error);
      return errorResponse(
        `Failed to process upgrade: ${error?.error?.description || error.message || 'Unknown error'}`,
        'UPGRADE_FAILED',
        500
      );
    }
  } catch (error: any) {
    console.error('Error in upgrade route:', error);
    return errorResponse(
      'Internal server error',
      'SERVER_ERROR',
      500
    );
  }
}