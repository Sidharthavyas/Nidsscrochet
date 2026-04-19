// pages/api/razorpay/get-order.js
// Fetch order details — supports both authenticated users and guest lookup

import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth is OPTIONAL for guest checkout
    const { userId } = getAuth(req);

    try {
        await connectDB();

        const { orderId, email } = req.query;
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID required' });
        }

        let order;

        if (userId) {
            // Logged-in user: match by userId
            order = await Order.findOne({
                orderId,
                'customer.clerkUserId': userId,
            }).lean();
        } else if (email) {
            // Guest: match by orderId + email (case-insensitive)
            order = await Order.findOne({
                orderId,
                isGuest: true,
                'customer.email': email.trim().toLowerCase(),
            }).lean();
        } else {
            // No auth and no email — allow unauthenticated access ONLY within 1 hour
            // of payment confirmation. This is needed for the order-success redirect
            // immediately after Razorpay callback, while still limiting PII exposure.
            const ONE_HOUR_MS = 60 * 60 * 1000;
            const cutoff = new Date(Date.now() - ONE_HOUR_MS);

            order = await Order.findOne({
                orderId,
                // Either paid recently, or still pending (not yet verified)
                $or: [
                    { paidAt: { $gte: cutoff } },
                    { status: { $in: ['pending', 'created'] }, createdAt: { $gte: cutoff } },
                ],
            }).lean();

            if (order) {
                // Strip internal/sensitive fields for unauthenticated access
                delete order.processedWebhookEvents;
                delete order.signature;
            } else {
                // Order exists but is outside the TTL window — return 404 rather than
                // exposing stale PII to anyone who stumbles upon an old order ID.
                const exists = await Order.exists({ orderId });
                if (exists) {
                    return res.status(403).json({ error: 'Order lookup window has expired. Please log in to view this order.' });
                }
            }
        }

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        return res.status(500).json({ error: 'Failed to fetch order' });
    }
}
