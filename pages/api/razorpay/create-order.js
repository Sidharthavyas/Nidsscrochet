import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

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
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await connectDB();

        const { amount, items, customer } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }
        if (!customer?.phone || !customer?.address) {
            return res.status(400).json({ error: 'Phone and address are required' });
        }

        // Create Razorpay order (amount in paise)
        const receiptId = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: receiptId.slice(0, 40), // Razorpay max 40 chars
            notes: {
                clerkUserId: userId,
                customerName: customer.name || '',
                customerPhone: customer.phone || '',
                customerEmail: customer.email || '',
                itemCount: String(items.length),
            },
        });

        // Save order to database
        const order = await Order.create({
            orderId: razorpayOrder.id,
            amount,
            currency: 'INR',
            status: 'created',
            items: items.map(item => ({
                productId: item.id || item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
            })),
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
        return res.status(500).json({ error: 'Failed to create order' });
    }
}
