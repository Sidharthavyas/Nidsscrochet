// pages/api/webhooks/razorpay.js
// Razorpay webhook handler — ensures payment success is recorded
// even if the frontend fails to call verify-payment.
//
// CRITICAL: This endpoint must NOT use Clerk auth (webhooks are server-to-server).
// It uses Razorpay's webhook signature for authentication instead.

import crypto from 'crypto';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Product from '../../../models/Product';
import Coupon from '../../../models/Coupon';
import { sendOrderConfirmationEmail } from '../../../lib/email';

// Disable Next.js body parsing so we can access raw body for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

// Read raw body as a Buffer
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const rawBody = await getRawBody(req);
        const bodyString = rawBody.toString('utf8');

        // ── 1. Verify webhook signature ────────────────────────────────
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook not configured' });
        }

        const receivedSignature = req.headers['x-razorpay-signature'];
        if (!receivedSignature) {
            console.error('[webhook] Missing x-razorpay-signature header');
            return res.status(400).json({ error: 'Missing signature' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(bodyString)
            .digest('hex');

        if (expectedSignature !== receivedSignature) {
            console.error('[webhook] SIGNATURE MISMATCH — rejecting webhook');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // ── 2. Parse event ─────────────────────────────────────────────
        const event = JSON.parse(bodyString);
        const eventType = event.event;
        const eventId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || 'unknown';

        console.log(`[webhook] Received event: ${eventType}, id: ${eventId}`);

        await connectDB();

        // ── 3. Deduplicate events ──────────────────────────────────────
        //    Check if we've already processed this event ID
        if (eventId !== 'unknown') {
            const alreadyProcessed = await Order.findOne({
                processedWebhookEvents: eventId,
            });
            if (alreadyProcessed) {
                console.log(`[webhook] Event ${eventId} already processed — skipping`);
                return res.status(200).json({ status: 'already_processed' });
            }
        }

        // ── 4. Handle payment events ───────────────────────────────────
        if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
            const payment = event.payload.payment.entity;
            const razorpayOrderId = payment.order_id;
            const razorpayPaymentId = payment.id;

            if (!razorpayOrderId) {
                console.error('[webhook] No order_id in payment payload');
                return res.status(200).json({ status: 'no_order_id' });
            }

            // Atomic update: pending/created → paid
            // If already paid (verify-payment ran first), this is a no-op
            const result = await Order.findOneAndUpdate(
                {
                    orderId: razorpayOrderId,
                    status: { $in: ['pending', 'created'] },
                },
                {
                    $set: {
                        status: 'paid',
                        paymentId: razorpayPaymentId,
                        paymentVerified: true,
                        paidAt: new Date(),
                    },
                    $addToSet: { processedWebhookEvents: eventId },
                },
                { new: true }
            );

            if (result) {
                console.log(`[webhook] ✅ Order ${razorpayOrderId} marked PAID via webhook`);

                // Deduct stock
                if (result.items && result.items.length > 0) {
                    for (const item of result.items) {
                        if (item.productId) {
                            try {
                                await Product.findOneAndUpdate(
                                    { _id: item.productId, stock: { $gte: item.quantity } },
                                    { $inc: { stock: -Math.abs(item.quantity) } }
                                );
                            } catch (err) {
                                console.error(`[webhook] Stock deduction failed for ${item.productId}:`, err?.message);
                            }
                        }
                    }
                }

                // Increment coupon usage
                if (result.couponCode) {
                    try {
                        await Coupon.findOneAndUpdate(
                            { code: result.couponCode.toUpperCase() },
                            { $inc: { usageCount: 1 } }
                        );
                    } catch (err) {
                        console.error('[webhook] Coupon increment failed:', err?.message);
                    }
                }

                // Send email
                try {
                    await sendOrderConfirmationEmail(result, result.customer, 'online');
                } catch (err) {
                    console.error('[webhook] Email failed:', err?.message);
                }
            } else {
                // Already paid or order not found
                console.log(`[webhook] No-op for order ${razorpayOrderId} (may already be paid)`);
                // Still record the event to prevent reprocessing
                await Order.updateOne(
                    { orderId: razorpayOrderId },
                    { $addToSet: { processedWebhookEvents: eventId } }
                );
            }

            return res.status(200).json({ status: 'ok' });
        }

        if (eventType === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const razorpayOrderId = payment.order_id;

            if (razorpayOrderId) {
                // Only mark as failed if still pending/created
                const result = await Order.updateOne(
                    {
                        orderId: razorpayOrderId,
                        status: { $in: ['pending', 'created'] },
                    },
                    {
                        $set: { status: 'failed' },
                        $addToSet: { processedWebhookEvents: eventId },
                    }
                );

                if (result.modifiedCount > 0) {
                    console.log(`[webhook] Order ${razorpayOrderId} marked FAILED via webhook`);
                }
            }

            return res.status(200).json({ status: 'ok' });
        }

        // Unhandled event type — acknowledge it to prevent retries
        console.log(`[webhook] Unhandled event type: ${eventType}`);
        return res.status(200).json({ status: 'unhandled_event' });

    } catch (error) {
        console.error('[webhook] Processing error:', error?.message || error);
        // Return 200 to prevent Razorpay from retrying on parse errors
        return res.status(200).json({ status: 'error', message: error?.message });
    }
}
