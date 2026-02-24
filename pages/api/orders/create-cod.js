// pages/api/orders/create-cod.js
// Create a Cash on Delivery order — bypasses Razorpay entirely

import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Coupon from '../../../models/Coupon';
import Product from '../../../models/Product';
import { sendOrderConfirmationEmail } from '../../../lib/email';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { amount, items, customer, shippingCharges, couponCode, discountAmount } = req.body;

        if (!amount || !items || !customer) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!customer.phone || !customer.address) {
            return res.status(400).json({ success: false, message: 'Phone and address are required' });
        }

        // Generate a unique COD order ID
        const codOrderId = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const order = await Order.create({
            orderId: codOrderId,
            amount: amount,
            currency: 'INR',
            status: 'pending',
            paymentMethod: 'cod',
            shippingCharges: shippingCharges || 0,
            couponCode: couponCode || null,
            discountAmount: parseFloat(discountAmount) || 0,
            items: items.map(item => ({
                productId: item.id || item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
            })),
            customer: {
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
        if (couponCode) {
            try {
                await Coupon.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    { $inc: { usageCount: 1 } }
                );
            } catch (err) {
                console.error('Failed to increment coupon usage:', err);
            }
        }

        // Deduct stock for each item
        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                if (item.productId) {
                    try {
                        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -Math.abs(item.quantity) } });
                    } catch (err) {
                        console.error('Failed to deduct stock for', item.productId, err);
                    }
                }
            }
        }

        return res.status(201).json({
            success: true,
            orderId: order.orderId,
            dbOrderId: order._id.toString(),
        });
    } catch (error) {
        console.error('COD order creation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create COD order' });
    }
}
