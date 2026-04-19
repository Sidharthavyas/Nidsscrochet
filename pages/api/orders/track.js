// pages/api/orders/track.js
// Track an order by orderId + email — primarily for guest users

import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

// Simple rate limiter (per IP, 20 lookups/min)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true;
    }
    entry.count++;
    return entry.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.start > RATE_LIMIT_WINDOW * 5) rateLimitMap.delete(ip);
    }
}, 5 * 60_000);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }

    try {
        const { orderId, email } = req.body;

        if (!orderId?.trim() || !email?.trim()) {
            return res.status(400).json({ success: false, message: 'Order ID and email are required' });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        await connectDB();

        const order = await Order.findOne({
            orderId: orderId.trim(),
            'customer.email': email.trim().toLowerCase(),
            // Only show confirmed/terminal orders — not pending payment attempts
            status: { $nin: ['pending', 'created'] },
        })
            .select('-processedWebhookEvents -signature')
            .lean();

        if (!order) {
            // Intentionally vague to prevent order enumeration
            return res.status(404).json({ success: false, message: 'No order found matching that ID and email' });
        }

        return res.status(200).json({
            success: true,
            data: JSON.parse(JSON.stringify(order)),
        });
    } catch (error) {
        console.error('[track-order] Error:', error?.message || 'Unknown');
        return res.status(500).json({ success: false, message: 'Failed to track order' });
    }
}
