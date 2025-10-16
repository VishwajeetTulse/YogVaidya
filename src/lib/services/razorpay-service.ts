import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: Date;
  description: string | null;
  orderId: string | null;
  email: string | null;
  contact: string | null;
}

export async function getPaymentHistory(
  userEmail?: string,
  limit: number = 50
): Promise<PaymentHistoryItem[]> {
  try {
    // 🚨 SECURITY FIX: NEVER return all payments - always require a valid email
    if (!userEmail || userEmail.trim() === "") {
      console.warn("🚨 SECURITY: Attempted to fetch payment history without valid email");
      throw new Error("User email is required for payment history access");
    }

    // Validate email format before proceeding
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      console.warn(`🚨 SECURITY: Invalid email format attempted: ${userEmail}`);
      throw new Error("Invalid email format");
    }

    const cleanEmail = userEmail.trim();

    // For specific user email, fetch more payments to ensure we get all user's payments
    // since Razorpay API doesn't support direct email filtering
    const batchSize = Math.max(limit * 2, 100); // Fetch more to account for filtering
    const allUserPayments: PaymentHistoryItem[] = [];
    let skip = 0;
    let hasMore = true;

    // Fetch payments in batches until we have enough user payments or no more payments exist
    while (hasMore && allUserPayments.length < limit) {
      try {
        const payments = await razorpay.payments.all({
          count: batchSize,
          skip: skip,
        });

        if (!payments.items || payments.items.length === 0) {
          hasMore = false;
          break;
        }

        const userPayments = payments.items
          .filter((payment) => {
            // Comprehensive email matching with the verified clean email
            const paymentEmail = payment.email?.toLowerCase().trim();
            const targetEmail = cleanEmail.toLowerCase();

            // Direct email match
            if (paymentEmail === targetEmail) {
              return true;
            }

            // Check in notes
            if (payment.notes) {
              const notesEmail = payment.notes.email?.toLowerCase().trim();
              if (notesEmail === targetEmail) {
                return true;
              }

              // Check other common note fields
              const customerEmail = payment.notes.customer_email?.toLowerCase().trim();
              const userEmailNote = payment.notes.user_email?.toLowerCase().trim();
              if (customerEmail === targetEmail || userEmailNote === targetEmail) {
                return true;
              }
            }

            return false;
          })
          .filter((payment) => {
            // Additional security check: log any payment without proper email association
            if (!payment.email && (!payment.notes || !payment.notes.email)) {
              console.warn(
                `⚠️  Payment ${payment.id} has no email association but passed filtering`
              );
            }
            return true; // Keep the payment as it passed the previous filter
          })
          .map((payment) => ({
            id: payment.id,
            amount: Number(payment.amount) / 100, // Convert paise to rupees
            currency: payment.currency,
            status: payment.status,
            method: payment.method || "Unknown",
            createdAt: new Date(payment.created_at * 1000),
            description: payment.description || null,
            orderId: payment.order_id || null,
            email: payment.email || null,
            contact: payment.contact ? String(payment.contact) : null,
          }));

        allUserPayments.push(...userPayments);
        skip += batchSize;

        // If we got fewer items than requested, we've reached the end
        if (payments.items.length < batchSize) {
          hasMore = false;
        }

        // Safety limit to prevent infinite loops
        if (skip > 1000) {
          hasMore = false;
        }
      } catch (batchError) {
        console.error(`Error fetching payment batch at skip ${skip}:`, batchError);
        hasMore = false;
      }
    }

    // Sort by newest first and limit results
    return allUserPayments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching payment history from Razorpay:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        throw new Error("Razorpay authentication failed. Please check API credentials.");
      } else if (error.message.includes("Network")) {
        throw new Error("Network error while connecting to Razorpay. Please try again.");
      } else if (error.message.includes("Rate limit")) {
        throw new Error("Too many requests to Razorpay. Please try again later.");
      }
    }

    throw new Error("Failed to fetch payment history from Razorpay");
  }
}

export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      id: payment.id,
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      createdAt: new Date(payment.created_at * 1000),
      description: payment.description,
      orderId: payment.order_id,
      email: payment.email,
      contact: payment.contact ? String(payment.contact) : null,
      notes: payment.notes,
    };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw new Error("Failed to fetch payment details");
  }
}
