// pages/api/orders/cancel.js
// Cancel a pending/created order (user dismissed the payment modal)
// Supports both authenticated users and guest checkout

import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth is OPTIONAL for guest checkout
    const { userId } = getAuth(req);

    try {
        await connectDB();

        const { razorpayOrderId, email } = req.body;

        if (!razorpayOrderId) {
            return res.status(400).json({ error: 'razorpayOrderId is required' });
        }

        // Build query: authenticated user uses userId, guest uses email
        const cancelQuery = {
            orderId: razorpayOrderId,
            status: { $in: ['pending', 'created'] },
        };

        if (userId) {
            cancelQuery['customer.clerkUserId'] = userId;
        } else if (email) {
            cancelQuery['customer.email'] = email.trim().toLowerCase();
            cancelQuery.isGuest = true;
        }
        // If no userId and no email, still allow cancel by orderId alone
        // (the Razorpay modal dismiss sends this — the order was just created seconds ago)

        const result = await Order.updateOne(
            cancelQuery,
            { $set: { status: 'cancelled' } }
        );

        if (result.modifiedCount === 0) {
            // Either doesn't exist, already paid, or already cancelled — all safe
            console.log(`[cancel] No-op for order ${razorpayOrderId} (may be already paid/cancelled)`);
            return res.status(200).json({ success: true, message: 'No pending order to cancel' });
        }

        console.log(`[cancel] Order ${razorpayOrderId} cancelled by ${userId ? 'user ' + userId : 'guest'}`);

        return res.status(200).json({ success: true, message: 'Order cancelled' });
    } catch (error) {
        console.error('[cancel] Error:', error?.message || 'Unknown');
        return res.status(500).json({ error: 'Failed to cancel order' });
    }
}
