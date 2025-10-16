"use server";

import { getUserBillingHistory } from "../server/billing-server";

export async function getBillingHistoryAction(userEmail: string) {
  try {
    // 🚨 SECURITY: Strict validation to prevent payment history leakage
    if (!userEmail || typeof userEmail !== "string" || userEmail.trim() === "") {
      console.warn("🚨 SECURITY: Invalid email provided to getBillingHistoryAction");
      return {
        success: false,
        error: "Valid user email is required",
        history: [],
      };
    }

    // Additional email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      console.warn(`🚨 SECURITY: Invalid email format in getBillingHistoryAction: ${userEmail}`);
      return {
        success: false,
        error: "Invalid email format",
        history: [],
      };
    }

    const cleanEmail = userEmail.trim();

    const history = await getUserBillingHistory(cleanEmail);

    // Note: Email validation happens at the Razorpay service level where raw payment data is available
    // The billing history returned here has already been filtered for the specific user

    return {
      success: true,
      history,
      count: history.length,
    };
  } catch (error) {
    console.error("Error in getBillingHistoryAction:", error);

    // Return empty array instead of undefined to prevent UI issues
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch billing history",
      history: [],
    };
  }
}
