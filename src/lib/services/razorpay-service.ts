import Razorpay from 'razorpay';

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

export async function getPaymentHistory(userEmail?: string, limit: number = 50): Promise<PaymentHistoryItem[]> {
  try {
    const payments = await razorpay.payments.all({
      count: limit,
      skip: 0,
    });

    return payments.items
      .filter(payment => {
        // Filter by user email if provided
        if (userEmail) {
          return payment.email === userEmail || 
                 (payment.notes && payment.notes.email === userEmail);
        }
        return true;
      })
      .map(payment => ({
        id: payment.id,
        amount: Number(payment.amount) / 100, // Convert paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method || 'Unknown',
        createdAt: new Date(payment.created_at * 1000),
        description: payment.description || null,
        orderId: payment.order_id || null,
        email: payment.email || null,
        contact: payment.contact ? String(payment.contact) : null,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  } catch (error) {
    console.error('Error fetching payment history from Razorpay:', error);
    throw new Error('Failed to fetch payment history');
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
    console.error('Error fetching payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
}
