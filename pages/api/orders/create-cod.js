// pages/api/orders/create-cod.js
// Create a Cash on Delivery order — bypasses Razorpay entirely

import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Coupon from '../../../models/Coupon';
import Product from '../../../models/Product';
import mongoose from 'mongoose';
import { sendOrderConfirmationEmail } from '../../../lib/email';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // ✅ FIX 1: Require authentication — unauthenticated COD was a critical vulnerability
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Sign in to place an order' });
    }

    try {
        await connectDB();

        const { items, customer, couponCode } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0 || !customer) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!customer.phone || !customer.address) {
            return res.status(400).json({ success: false, message: 'Phone and address are required' });
        }

        // ✅ FIX 2: Server-side price computation — never trust client-sent amounts
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

        // Compute subtotal from DB prices (price is stored as String)
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
            subtotal += unitPrice * qty;
            resolvedItems.push({
                productId: id,
                name: dbProduct.name,
                price: unitPrice,
                quantity: qty,
                image: dbProduct.image || (dbProduct.images?.[0] ?? ''),
            });
        }

        // ✅ FIX 3: Validate and compute coupon discount server-side
        let serverDiscount = 0;
        let appliedCouponCode = null;

        if (couponCode) {
            const normalizedCode = String(couponCode).toUpperCase().trim();

            // ✅ FIX 4: Per-user coupon abuse prevention
            const alreadyUsed = await Order.findOne({
                'customer.clerkUserId': userId,
                couponCode: normalizedCode,
                status: { $in: ['paid', 'pending', 'processing', 'shipped', 'delivered'] },
            });
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

        // Compute server-side shipping (free over ₹500)
        const discountedSubtotal = subtotal - serverDiscount;
        const serverShipping = discountedSubtotal >= 500 ? 0 : 80;
        const serverAmount = Math.max(0, discountedSubtotal + serverShipping);

        // Generate a unique COD order ID
        const codOrderId = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const order = await Order.create({
            orderId: codOrderId,
            amount: serverAmount,
            currency: 'INR',
            status: 'pending',
            paymentMethod: 'cod',
            shippingCharges: serverShipping,
            couponCode: appliedCouponCode,
            discountAmount: serverDiscount,
            items: resolvedItems,
            customer: {
                clerkUserId: userId, // ✅ Link order to authenticated user
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone,
                address: customer.address,
                notes: customer.notes || '',
            },
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

        // ✅ FIX 5: Atomic stock deduction with guard against overselling
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
        console.error('COD order creation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create COD order' });
    }
}
