import connectDB from '../../../lib/mongodb';
import Coupon from '../../../models/Coupon';

export default async function handler(req, res) {
    const { method } = req;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
    }

    try {
        await connectDB();
        const { code, orderValue } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
        }

        // Find the coupon
        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        // Check if active
        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
        }

        // Check expiry
        if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        // Check max uses
        if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
            return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
        }

        // Check min order value
        if (orderValue !== undefined && orderValue < coupon.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Order must be at least ₹${coupon.minOrderValue} to use this coupon`
            });
        }

        // Calculate the actual discount amount based on the provided orderValue
        let discountAmount = 0;
        if (orderValue !== undefined) {
            if (coupon.discountType === 'percentage') {
                discountAmount = Math.floor(orderValue * (coupon.discountValue / 100)); // round down to nearest rupee
            } else {
                discountAmount = coupon.discountValue;
            }
            // Ensure we don't discount more than the order total!
            if (discountAmount > orderValue) {
                discountAmount = orderValue;
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: discountAmount,
                _id: coupon._id
            }
        });

    } catch (error) {
        console.error('❌ Coupon Validation Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while validating coupon' });
    }
}
