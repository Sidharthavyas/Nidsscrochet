// pages/api/cron/expire-orders.js
// Auto-expire stale pending/created orders.
//
// Call this via:
//   - Vercel Cron (vercel.json) every 10 minutes
//   - Or manually: GET /api/cron/expire-orders?secret=YOUR_CRON_SECRET
//
// This prevents pending orders from accumulating forever.

import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req, res) {
    // Simple security: require a secret or Vercel cron header
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;

    const isVercelCron = authHeader === `Bearer ${cronSecret}`;
    const isManualTrigger = querySecret && querySecret === cronSecret;

    if (cronSecret && !isVercelCron && !isManualTrigger) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await connectDB();

        const now = new Date();

        // Cancel all pending/created orders that have expired
        const result = await Order.updateMany(
            {
                status: { $in: ['pending', 'created'] },
                expiresAt: { $lt: now, $ne: null },
            },
            { $set: { status: 'cancelled' } }
        );

        console.log(`[cron/expire-orders] Cancelled ${result.modifiedCount} expired orders`);

        return res.status(200).json({
            success: true,
            expiredCount: result.modifiedCount,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('[cron/expire-orders] Error:', error?.message || error);
        return res.status(500).json({ error: 'Failed to expire orders' });
    }
}
