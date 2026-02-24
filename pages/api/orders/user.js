import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized — please sign in' });
        }

        await connectDB();

        // Fetch all orders for this specific Clerk user, sorted newest first
        const orders = await Order.find({ 'customer.clerkUserId': userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ success: true, data: JSON.parse(JSON.stringify(orders)) });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
