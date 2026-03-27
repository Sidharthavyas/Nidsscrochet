// pages/api/razorpay/create-order.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Product from '../../../models/Product';
import Coupon from '../../../models/Coupon';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized — please sign in' });
    }

    try {
        await connectDB();

        // C-1: Never trust client-sent amounts — recompute entirely from DB
        const { items, customer, couponCode } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }
        if (!customer?.phone || !customer?.address) {
            return res.status(400).json({ error: 'Phone and address are required' });
        }

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
            subtotal += unitPrice * qty;
            resolvedItems.push({
                productId: id,
                name: dbProduct.name,
                price: unitPrice,
                quantity: qty,
                image: dbProduct.image || (dbProduct.images?.[0] ?? ''),
            });
        }

        // Validate coupon server-side
        let serverDiscount = 0;
        let appliedCouponCode = null;
        if (couponCode) {
            const normalizedCode = String(couponCode).toUpperCase().trim();
            const alreadyUsed = await Order.findOne({
                'customer.clerkUserId': userId,
                couponCode: normalizedCode,
                status: { $in: ['paid', 'pending', 'processing', 'shipped', 'delivered'] },
            });
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

        // Compute shipping server-side (free over ₹500)
        const discountedSubtotal = subtotal - serverDiscount;
        const serverShipping = discountedSubtotal >= 500 ? 0 : 80;
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
                clerkUserId: userId,
                customerName: customer.name || '',
                customerPhone: customer.phone || '',
                customerEmail: customer.email || '',
                itemCount: String(resolvedItems.length),
            },
        });

        // Save order to DB with server-computed amounts
        const order = await Order.create({
            orderId: razorpayOrder.id,
            amount: serverAmount,
            currency: 'INR',
            status: 'created',
            paymentMethod: 'online',
            shippingCharges: serverShipping,
            couponCode: appliedCouponCode,
            discountAmount: serverDiscount,
            items: resolvedItems,
            customer: {
                clerkUserId: userId,
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone,
                address: customer.address,
                notes: customer.notes || '',
            },
        });

        return res.status(200).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            dbOrderId: order._id,
        });
    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({ error: error.message || 'Failed to create order' });
    }
}
