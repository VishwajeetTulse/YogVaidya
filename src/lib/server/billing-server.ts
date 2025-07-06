"use server";

import { getPaymentHistory } from "../services/razorpay-service";

export async function getUserBillingHistory(userEmail: string) {
  try {
    if (!userEmail) {
      throw new Error("User email is required");
    }

    // Get payment history from Razorpay
    const paymentHistory = await getPaymentHistory(userEmail, 20);

    // Transform the data for better display
    const billingHistory = paymentHistory.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      createdAt: payment.createdAt,
      description: payment.description || `${payment.method} Payment`,
      orderId: payment.orderId,
      planName: getPlanNameFromDescription(payment.description),
      planType: getPlanTypeFromAmount(payment.amount),
      paymentMethod: formatPaymentMethod(payment.method),
      formattedStatus: formatPaymentStatus(payment.status),
      razorpayPaymentId: payment.id
    }));

    return billingHistory;
  } catch (error) {
    console.error('Error fetching billing history:', error);
    throw new Error('Failed to fetch billing history');
  }
}

// Helper functions to format data
function getPlanNameFromDescription(description: string | null): string {
  if (!description) return 'Subscription Payment';
  
  if (description.toLowerCase().includes('bloom')) return 'Bloom Plan';
  if (description.toLowerCase().includes('flourish')) return 'Flourish Plan';
  if (description.toLowerCase().includes('seed')) return 'Seed Plan';
  
  return description;
}

function getPlanTypeFromAmount(amount: number): string {
  // Based on your pricing structure
  if (amount >= 3000) return 'FLOURISH';
  if (amount >= 1500) return 'BLOOM';
  if (amount >= 500) return 'SEED';
  
  return 'UNKNOWN';
}

function formatPaymentMethod(method: string): string {
  switch (method.toLowerCase()) {
    case 'card': return 'Credit/Debit Card';
    case 'netbanking': return 'Net Banking';
    case 'wallet': return 'Wallet';
    case 'upi': return 'UPI';
    default: return method.charAt(0).toUpperCase() + method.slice(1);
  }
}

function formatPaymentStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'captured': return 'Successful';
    case 'authorized': return 'Authorized';
    case 'failed': return 'Failed';
    case 'refunded': return 'Refunded';
    case 'created': return 'Pending';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
