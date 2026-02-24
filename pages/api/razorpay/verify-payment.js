import crypto from 'crypto';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Coupon from '../../../models/Coupon';
import Product from '../../../models/Product';
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
      await Order.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Signature valid — update order to paid
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
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    // Increment coupon usage count if applied
    if (order.couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode.toUpperCase() },
          { $inc: { usageCount: 1 } }
        );
      } catch (err) {
        console.error('Failed to increment coupon usage:', err);
      }
    }

    // Deduct stock
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.productId) {
          try {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -Math.abs(item.quantity) },
            });
          } catch (err) {
            console.error('Failed to deduct stock for', item.productId, err);
          }
        }
      }
    }

    // ✅ FIX: AWAIT the email so it completes before the function terminates
    let emailResult = { success: false, reason: 'not_attempted' };
    try {
      emailResult = await sendOrderConfirmationEmail(
        order,
        order.customer,
        'online'
      );
      console.log('[verify-payment] Email result:', JSON.stringify(emailResult));
    } catch (err) {
      console.error('[verify-payment] Email send error:', err?.message || err);
      emailResult = { success: false, error: err?.message };
    }

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      paymentId: order.paymentId,
      amount: order.amount,
      emailSent: emailResult.success, // ✅ Now you can see if it worked
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}