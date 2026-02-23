// pages/api/orders/index.js
// GET: list all orders (admin)
// PUT: update order status (admin)

import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { verifyToken } from '../../../lib/authMiddleware';

export default async function handler(req, res) {
    await connectDB();

    // Verify admin JWT token
    const auth = verifyToken(req);
    if (!auth.valid || auth.user?.role !== 'admin') {
        return res.status(401).json({ success: false, message: auth.error || 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;
            const status = req.query.status; // optional filter

            const query = {};
            if (status && status !== 'all') {
                query.status = status;
            }

            const [orders, total] = await Promise.all([
                Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                Order.countDocuments(query),
            ]);

            return res.status(200).json({
                success: true,
                data: JSON.parse(JSON.stringify(orders)),
                total,
                page,
                totalPages: Math.ceil(total / limit),
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            return res.status(500).json({ success: false, message: 'Error fetching orders' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { orderId, status } = req.body;

            if (!orderId || !status) {
                return res.status(400).json({ success: false, message: 'orderId and status are required' });
            }

            const validStatuses = ['pending', 'created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            }

            const order = await Order.findByIdAndUpdate(
                orderId,
                { status },
                { new: true }
            ).lean();

            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            return res.status(200).json({
                success: true,
                data: JSON.parse(JSON.stringify(order)),
            });
        } catch (error) {
            console.error('Error updating order:', error);
            return res.status(500).json({ success: false, message: 'Error updating order' });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
