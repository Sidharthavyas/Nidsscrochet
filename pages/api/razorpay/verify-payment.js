// pages/api/razorpay/verify-payment.js
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

    // ── 1. Verify HMAC SHA256 signature ────────────────────────────────
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error(`[verify-payment] SIGNATURE MISMATCH for order ${razorpay_order_id}`);
      // Mark as failed atomically — only if still pending/created
      await Order.updateOne(
        { orderId: razorpay_order_id, status: { $in: ['pending', 'created'] } },
        { $set: { status: 'failed' } }
      );
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // ── 2. Atomic state transition: pending/created → paid ─────────────
    //    This is the ONLY place an order becomes "paid" via frontend.
    //    The condition `status: { $in: ['pending', 'created'] }` prevents:
    //      - double-marking (idempotent if already paid)
    //      - marking cancelled/failed orders as paid
    //    We also verify the requesting user owns the order.
    const order = await Order.findOneAndUpdate(
      {
        orderId: razorpay_order_id,
        'customer.clerkUserId': userId,
        status: { $in: ['pending', 'created'] },
      },
      {
        $set: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'paid',
          paymentVerified: true,
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!order) {
      // Could be already paid (by webhook), or not found
      const existing = await Order.findOne({ orderId: razorpay_order_id }).lean();
      if (existing && existing.status === 'paid') {
        // Already marked paid (likely by webhook) — return success
        console.log(`[verify-payment] Order ${razorpay_order_id} already paid (webhook race won)`);
        return res.status(200).json({
          success: true,
          orderId: existing.orderId,
          paymentId: existing.paymentId || razorpay_payment_id,
          amount: existing.amount,
          alreadyProcessed: true,
        });
      }
      console.error(`[verify-payment] Order not found or unauthorized: ${razorpay_order_id}, user: ${userId}`);
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    console.log(`[verify-payment] ✅ Order ${razorpay_order_id} marked PAID for user ${userId}`);

    // ── 3. Increment coupon usage count ────────────────────────────────
    if (order.couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode.toUpperCase() },
          { $inc: { usageCount: 1 } }
        );
      } catch (err) {
        console.error('[verify-payment] Failed to increment coupon usage:', err);
      }
    }

    // ── 4. Deduct stock atomically ─────────────────────────────────────
    //    Only deduct AFTER payment is confirmed.
    //    Guard: { stock: { $gte: quantity } } prevents overselling.
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.productId) {
          try {
            const updated = await Product.findOneAndUpdate(
              { _id: item.productId, stock: { $gte: item.quantity } },
              { $inc: { stock: -Math.abs(item.quantity) } },
              { new: true }
            );
            if (!updated) {
              // Out of stock after payment — mark order failed, will need manual refund
              await Order.findByIdAndUpdate(order._id, { status: 'failed' });
              console.error(`[verify-payment] STOCK EXHAUSTED for ${item.name} (${item.productId}), order ${order.orderId} marked failed`);
              return res.status(409).json({
                error: `"${item.name || item.productId}" is out of stock. Payment will be refunded automatically by Razorpay.`,
              });
            }
          } catch (err) {
            console.error('[verify-payment] Failed to deduct stock for', item.productId, err?.message || 'Unknown');
          }
        }
      }
    }

    // ── 5. Send confirmation email ─────────────────────────────────────
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
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('[verify-payment] Error:', error?.message || 'Unknown error');
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}