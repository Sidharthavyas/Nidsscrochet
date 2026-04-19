// pages/api/razorpay/create-order.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Product from '../../../models/Product';
import Coupon from '../../../models/Coupon';
import { computeShipping } from '../../../lib/shipping';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Simple rate limiter (per IP, 10 orders/min) ─────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;

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

// Periodically clean up stale entries (every 5 min)
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.start > RATE_LIMIT_WINDOW * 5) rateLimitMap.delete(ip);
    }
}, 5 * 60_000);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    // Auth is OPTIONAL for guest checkout
    const { userId } = getAuth(req);
    const isGuest = !userId;

    try {
        await connectDB();

        // C-1: Never trust client-sent amounts — recompute entirely from DB
        const { items, customer, couponCode } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }

        // ── Validate customer details (required for both guest and logged-in) ──
        if (!customer?.name?.trim()) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        if (!customer?.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }
        if (!customer?.phone?.trim()) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        if (!customer?.address?.trim()) {
            return res.status(400).json({ error: 'Delivery address is required' });
        }

        // Sanitize customer input
        const sanitizedCustomer = {
            clerkUserId: userId || null,
            name: customer.name.trim().slice(0, 200),
            email: customer.email.trim().toLowerCase().slice(0, 320),
            phone: customer.phone.trim().slice(0, 30),
            address: customer.address.trim().slice(0, 1000),
            addressLine1: (customer.addressLine1 || '').trim().slice(0, 500),
            city: (customer.city || '').trim().slice(0, 100),
            state: (customer.state || '').trim().slice(0, 100),
            pincode: (customer.pincode || '').trim().slice(0, 10),
            notes: (customer.notes || '').trim().slice(0, 500),
        };

        // Validate all product IDs are real Mongo IDs
        const productIds = items
            .map((i) => i.productId || i.id)
            .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

        if (productIds.length !== items.length) {
            return res.status(400).json({ error: 'One or more invalid product IDs' });
        }

        // Fetch live prices from DB
        const dbProducts = await Product.find({ _id: { $in: productIds }, active: true }).lean();
        if (dbProducts.length !== productIds.length) {
            return res.status(400).json({ error: 'One or more products are unavailable' });
        }

        const productMap = Object.fromEntries(dbProducts.map((p) => [p._id.toString(), p]));

        let subtotal = 0;
        const resolvedItems = [];
        for (const item of items) {
            const id = (item.productId || item.id).toString();
            const dbProduct = productMap[id];
            if (!dbProduct) {
                return res.status(400).json({ error: `Product not found: ${id}` });
            }
            const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
            const rawPrice = dbProduct.salePrice || dbProduct.price;
            const unitPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '') || '0');

            // Stock validation — reject before creating Razorpay order
            if (qty > (dbProduct.stock ?? 0)) {
                return res.status(409).json({
                    error: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock ?? 0} available.`,
                });
            }

            subtotal += unitPrice * qty;
            resolvedItems.push({
                productId: id,
                name: dbProduct.name,
                price: unitPrice,
                quantity: qty,
                image: dbProduct.image || (dbProduct.images?.[0] ?? ''),
                 shipping_charges: dbProduct.shipping_charges ?? null,
            });
        }

        // Validate coupon server-side
        let serverDiscount = 0;
        let appliedCouponCode = null;
        if (couponCode) {
            const normalizedCode = String(couponCode).toUpperCase().trim();

            // Per-user/guest coupon abuse prevention
            const couponQuery = userId
                ? { 'customer.clerkUserId': userId, couponCode: normalizedCode, status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } }
                : { 'customer.email': sanitizedCustomer.email, couponCode: normalizedCode, isGuest: true, status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } };

            const alreadyUsed = await Order.findOne(couponQuery);
            if (alreadyUsed) {
                return res.status(400).json({ error: 'You have already used this coupon code' });
            }
            const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
            if (!coupon) {
                return res.status(400).json({ error: 'Invalid or expired coupon code' });
            }
            if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
                return res.status(400).json({ error: 'This coupon has reached its usage limit' });
            }
            if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
                return res.status(400).json({ error: 'This coupon has expired' });
            }
            if (subtotal < (coupon.minOrderValue || 0)) {
                return res.status(400).json({ error: `Minimum order value ₹${coupon.minOrderValue} required` });
            }
            serverDiscount = coupon.discountType === 'percentage'
                ? (subtotal * coupon.discountValue) / 100
                : Math.min(coupon.discountValue, subtotal);
            appliedCouponCode = normalizedCode;
        }

        
        const discountedSubtotal = subtotal - serverDiscount;
        const serverShipping = computeShipping(resolvedItems, discountedSubtotal);
        const serverAmount = Math.max(0, discountedSubtotal + serverShipping);

        if (serverAmount <= 0) {
            return res.status(400).json({ error: 'Computed order amount must be greater than 0' });
        }

        // Create Razorpay order (amount in paise)
        const amountInPaise = Math.round(serverAmount * 100);
        const receiptId = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId.slice(0, 40),
            notes: {
                clerkUserId: userId || 'guest',
                customerName: sanitizedCustomer.name,
                customerPhone: sanitizedCustomer.phone,
                customerEmail: sanitizedCustomer.email,
                isGuest: String(isGuest),
                itemCount: String(resolvedItems.length),
            },
        });

        // Save as "pending" with an expiry
        const order = await Order.create({
            orderId: razorpayOrder.id,
            amount: serverAmount,
            currency: 'INR',
            status: 'pending',
            paymentMethod: 'online',
            paymentVerified: false,
            isGuest,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // auto-expire in 30 min
            shippingCharges: serverShipping,
            couponCode: appliedCouponCode,
            discountAmount: serverDiscount,
            items: resolvedItems,
            customer: sanitizedCustomer,
        });

        console.log(`[create-order] Pending order ${razorpayOrder.id} for ${isGuest ? 'guest' : 'user ' + userId}, amount ₹${serverAmount}`);

        return res.status(200).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            dbOrderId: order._id,
        });
    } catch (error) {
        console.error('Create order error:', error?.message || 'Unknown error');
        return res.status(500).json({ error: error.message || 'Failed to create order' });
    }
}
