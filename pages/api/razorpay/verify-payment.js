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

  // Auth is OPTIONAL — guest checkout doesn't have a userId
  const { userId } = getAuth(req);

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
    //    Build query: if userId present, verify ownership; if guest, skip user check
    const updateQuery = {
      orderId: razorpay_order_id,
      status: { $in: ['pending', 'created'] },
    };

    // If logged in, verify the order belongs to this user
    if (userId) {
      updateQuery['customer.clerkUserId'] = userId;
    }
    // For guests, we rely on the Razorpay signature as proof of payment ownership

    const order = await Order.findOneAndUpdate(
      updateQuery,
      {
        $set: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'paid',
          paymentVerified: true,
          paidAt: new Date(),
          // If user just logged in mid-checkout, link the order to their account
          ...(userId && { 'customer.clerkUserId': userId, isGuest: false }),
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
      console.error(`[verify-payment] Order not found or unauthorized: ${razorpay_order_id}, user: ${userId || 'guest'}`);
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    console.log(`[verify-payment] ✅ Order ${razorpay_order_id} marked PAID for ${userId ? 'user ' + userId : 'guest'}`);

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

    // ── 4. Deduct stock — two-pass to prevent partial inventory corruption ─
    //    Pass 1: attempt decrement for every item; record successes and failures.
    //    Pass 2: if ANY item failed, roll back ALL previously-decremented items
    //            before marking the order failed and returning the error.
    if (order.items && order.items.length > 0) {
      const decremented = []; // { productId, quantity } items already decremented
      const stockErrors = []; // names of items that ran out

      for (const item of order.items) {
        if (!item.productId) continue;
        try {
          const updated = await Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -Math.abs(item.quantity) } },
            { new: true }
          );
          if (!updated) {
            stockErrors.push(item.name || String(item.productId));
          } else {
            decremented.push({ productId: item.productId, quantity: item.quantity });
          }
        } catch (err) {
          console.error('[verify-payment] Failed to deduct stock for', item.productId, err?.message || 'Unknown');
          stockErrors.push(item.name || String(item.productId));
        }
      }

      if (stockErrors.length > 0) {
        // Roll back every item that was successfully decremented in this pass
        for (const { productId, quantity } of decremented) {
          try {
            await Product.findByIdAndUpdate(productId, { $inc: { stock: Math.abs(quantity) } });
          } catch (err) {
            console.error('[verify-payment] ROLLBACK FAILED for', productId, err?.message);
          }
        }

        // Mark order failed — customer will need a manual refund
        await Order.findByIdAndUpdate(order._id, { status: 'failed' });
        const outOfStock = stockErrors.join('", "');
        console.error(`[verify-payment] STOCK EXHAUSTED for "${outOfStock}", order ${order.orderId} marked failed; ${decremented.length} item(s) rolled back`);
        return res.status(409).json({
          error: `"${outOfStock}" is out of stock. Payment will be refunded automatically by Razorpay.`,
        });
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