import crypto from 'crypto';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { sendOrderConfirmationEmail } from '../../../lib/email';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await connectDB();

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment details' });
        }

        // Verify signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Mark order as failed
            await Order.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: 'failed' }
            );
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Signature valid — update order to paid (also verify ownership)
        const order = await Order.findOneAndUpdate(
            { orderId: razorpay_order_id, 'customer.clerkUserId': userId },
            {
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                status: 'paid',
            },
            { new: true }
        );

        if (!order) {
            // Order may exist but belong to another user, or not exist at all
            return res.status(404).json({ error: 'Order not found or unauthorized' });
        }

        // Send confirmation email asynchronously (never block the response)
        sendOrderConfirmationEmail(order, order.customer, 'online').catch((err) =>
            console.error('[email] Failed to send order confirmation:', err)
        );

        return res.status(200).json({
            success: true,
            orderId: order.orderId,
            paymentId: order.paymentId,
            amount: order.amount,
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ error: 'Payment verification failed' });
    }
}
