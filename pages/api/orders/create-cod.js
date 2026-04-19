// pages/api/orders/create-cod.js
// Create a Cash on Delivery order — bypasses Razorpay entirely
// Supports both authenticated and guest checkout

import crypto from 'crypto';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Coupon from '../../../models/Coupon';
import Product from '../../../models/Product';
import mongoose from 'mongoose';
import { sendOrderConfirmationEmail } from '../../../lib/email';
import { computeShipping } from '../../../lib/shipping';

// ── Simple rate limiter (per IP, 5 COD orders/min) ─────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5; // Stricter for COD (no payment friction to deter spam)

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
        return res.status(429).json({ success: false, message: 'Too many requests. Please wait a moment.' });
    }

    // Auth is OPTIONAL for guest checkout
    const { userId } = getAuth(req);
    const isGuest = !userId;

    try {
        await connectDB();

        const { items, customer, couponCode } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0 || !customer) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // ── Validate customer details ──────────────────────────────────────
        if (!customer?.name?.trim()) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }
        if (!customer?.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
            return res.status(400).json({ success: false, message: 'A valid email address is required' });
        }
        if (!customer?.phone?.trim()) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }
        if (!customer?.address?.trim()) {
            return res.status(400).json({ success: false, message: 'Delivery address is required' });
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

        // Server-side price computation — never trust client-sent amounts
        const productIds = items
            .map((i) => i.productId || i.id)
            .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

        if (productIds.length !== items.length) {
            return res.status(400).json({ success: false, message: 'One or more invalid product IDs' });
        }

        const dbProducts = await Product.find({ _id: { $in: productIds }, active: true }).lean();

        if (dbProducts.length !== productIds.length) {
            return res.status(400).json({ success: false, message: 'One or more products are unavailable' });
        }

        // Build a lookup map
        const productMap = Object.fromEntries(dbProducts.map((p) => [p._id.toString(), p]));

        // Compute subtotal from DB prices
        let subtotal = 0;
        const resolvedItems = [];
        for (const item of items) {
            const id = (item.productId || item.id).toString();
            const dbProduct = productMap[id];
            if (!dbProduct) {
                return res.status(400).json({ success: false, message: `Product not found: ${id}` });
            }
            const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
            const rawPrice = dbProduct.salePrice || dbProduct.price;
            const unitPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '') || '0');

            // Stock validation — reject upfront before creating order
            if (qty > (dbProduct.stock ?? 0)) {
                return res.status(409).json({
                    success: false,
                    message: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock ?? 0} available.`,
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

        // Validate and compute coupon discount server-side
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
                return res.status(400).json({ success: false, message: 'You have already used this coupon code' });
            }

            const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
            }
            if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
                return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
            }
            if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
                return res.status(400).json({ success: false, message: 'This coupon has expired' });
            }
            if (subtotal < (coupon.minOrderValue || 0)) {
                return res
                    .status(400)
                    .json({ success: false, message: `Minimum order value ₹${coupon.minOrderValue} required for this coupon` });
            }

            if (coupon.discountType === 'percentage') {
                serverDiscount = (subtotal * coupon.discountValue) / 100;
            } else {
                serverDiscount = Math.min(coupon.discountValue, subtotal);
            }
            appliedCouponCode = normalizedCode;
        }

        // Compute server-side shipping (< ₹500 → ₹80, ₹500–799 → ₹50, ≥ ₹800 → free)
        const discountedSubtotal = subtotal - serverDiscount;
       const serverShipping = computeShipping(resolvedItems, discountedSubtotal);
        const serverAmount = Math.max(0, discountedSubtotal + serverShipping);

        // Generate a unique COD order ID using cryptographically random bytes
        const codOrderId = `COD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;


        const order = await Order.create({
            orderId: codOrderId,
            amount: serverAmount,
            currency: 'INR',
            status: 'pending',
            paymentMethod: 'cod',
            isGuest,
            shippingCharges: serverShipping,
            couponCode: appliedCouponCode,
            discountAmount: serverDiscount,
            items: resolvedItems,
            customer: sanitizedCustomer,
        });

        // Send confirmation email asynchronously (never block the response)
        sendOrderConfirmationEmail(order, order.customer, 'cod').catch((err) =>
            console.error('[email] Failed to send COD confirmation:', err)
        );

        // Increment coupon usage count if applied
        if (appliedCouponCode) {
            Coupon.findOneAndUpdate(
                { code: appliedCouponCode },
                { $inc: { usageCount: 1 } }
            ).catch((err) => console.error('Failed to increment coupon usage:', err));
        }

        // Atomic stock deduction with guard against overselling
        for (const item of resolvedItems) {
            if (item.productId) {
                const updated = await Product.findOneAndUpdate(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
                if (!updated) {
                    // Rollback: cancel the order rather than silently oversell
                    await Order.findByIdAndUpdate(order._id, { status: 'cancelled' });
                    return res.status(409).json({
                        success: false,
                        message: `"${item.name}" is out of stock. Your order has been cancelled.`,
                    });
                }
            }
        }

        return res.status(201).json({
            success: true,
            orderId: order.orderId,
            dbOrderId: order._id.toString(),
            amount: serverAmount,
        });
    } catch (error) {
        console.error('COD order creation error:', error?.message || 'Unknown error');
        return res.status(500).json({ success: false, message: 'Failed to create COD order' });
    }
}
