'use server'
import crypto from 'crypto';

export default async function verify(subscription_id:string, payment_id:string, signature:string){

    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(payment_id + "|" + subscription_id, 'utf-8').digest('hex');
    return(generated_signature === signature)
}

