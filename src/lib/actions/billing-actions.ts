"use server";

import { getUserBillingHistory } from "../server/billing-server";

export async function getBillingHistoryAction(userEmail: string) {
  try {
    if (!userEmail) {
      return { 
        success: false, 
        error: "User email is required" 
      };
    }

    const history = await getUserBillingHistory(userEmail);
    return { success: true, history };
  } catch (error) {
    console.error('Error in getBillingHistoryAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch billing history" 
    };
  }
}
