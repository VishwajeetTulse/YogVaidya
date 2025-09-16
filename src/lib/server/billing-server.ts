"use server";

import { getPaymentHistory } from "../services/razorpay-service";

export async function getUserBillingHistory(userEmail: string) {
  try {
    if (!userEmail) {
      throw new Error("User email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error("Invalid email format");
    }

    console.log(`Fetching billing history for user: ${userEmail}`);

    // Get payment history from Razorpay
    const paymentHistory = await getPaymentHistory(userEmail, 50); // Increased limit to get more complete history

    console.log(`Found ${paymentHistory.length} payments for user: ${userEmail}`);

    // Transform the data for better display
    const billingHistory = paymentHistory.map(payment => {
      try {
        return {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency || 'INR',
          status: payment.status,
          method: payment.method,
          createdAt: payment.createdAt,
          description: payment.description || `${formatPaymentMethod(payment.method)} Payment`,
          orderId: payment.orderId,
          planName: getPlanNameFromDescription(payment.description),
          planType: getPlanTypeFromAmount(payment.amount),
          paymentMethod: formatPaymentMethod(payment.method),
          formattedStatus: formatPaymentStatus(payment.status),
          razorpayPaymentId: payment.id
        };
      } catch (mappingError) {
        console.error('Error mapping payment data:', mappingError, payment);
        // Return a fallback object for corrupted payment data
        return {
          id: payment.id || 'unknown',
          amount: Number(payment.amount) || 0,
          currency: payment.currency || 'INR',
          status: payment.status || 'unknown',
          method: payment.method || 'unknown',
          createdAt: payment.createdAt || new Date(),
          description: 'Payment (Data Error)',
          orderId: payment.orderId,
          planName: 'Unknown Plan',
          planType: 'UNKNOWN',
          paymentMethod: 'Unknown Method',
          formattedStatus: 'Unknown Status',
          razorpayPaymentId: payment.id || 'unknown'
        };
      }
    });

    // Filter out any null/undefined entries and sort by date
    const validBillingHistory = billingHistory
      .filter(bill => bill && bill.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`Returning ${validBillingHistory.length} valid billing records for user: ${userEmail}`);

    return validBillingHistory;
  } catch (error) {
    console.error('Error fetching billing history:', error);
    
    // Provide more specific error handling
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('credentials')) {
        throw new Error('Payment service authentication error. Please contact support.');
      } else if (error.message.includes('Network') || error.message.includes('timeout')) {
        throw new Error('Network error while fetching payment history. Please try again.');
      } else if (error.message.includes('Invalid email')) {
        throw error; // Re-throw validation errors as-is
      }
    }
    
    throw new Error('Failed to fetch billing history. Please try again or contact support.');
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
