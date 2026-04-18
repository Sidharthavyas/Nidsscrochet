// pages/api/orders/cancel.js
// Cancel a pending/created order (user dismissed the payment modal)

import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

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

        const { razorpayOrderId } = req.body;

        if (!razorpayOrderId) {
            return res.status(400).json({ error: 'razorpayOrderId is required' });
        }

        // Atomic cancel: only if still pending/created AND owned by this user
        // This prevents cancelling already-paid orders (e.g. webhook arrived first)
        const result = await Order.updateOne(
            {
                orderId: razorpayOrderId,
                'customer.clerkUserId': userId,
                status: { $in: ['pending', 'created'] },
            },
            { $set: { status: 'cancelled' } }
        );

        if (result.modifiedCount === 0) {
            // Either doesn't exist, already paid, or already cancelled — all safe
            console.log(`[cancel] No-op for order ${razorpayOrderId} (may be already paid/cancelled)`);
            return res.status(200).json({ success: true, message: 'No pending order to cancel' });
        }

        console.log(`[cancel] Order ${razorpayOrderId} cancelled by user ${userId}`);

        return res.status(200).json({ success: true, message: 'Order cancelled' });
    } catch (error) {
        console.error('[cancel] Error:', error?.message || 'Unknown');
        return res.status(500).json({ error: 'Failed to cancel order' });
    }
}
