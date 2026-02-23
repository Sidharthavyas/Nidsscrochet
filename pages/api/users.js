// pages/api/users.js
// Fetch registered users from Clerk for admin dashboard

import { clerkClient } from '@clerk/nextjs/server';
import { verifyToken } from '../../lib/authMiddleware';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Verify admin JWT token (same token used by all admin dashboard APIs)
    const auth = verifyToken(req);
    if (!auth.valid || auth.user?.role !== 'admin') {
        return res.status(401).json({ success: false, message: auth.error || 'Unauthorized' });
    }

    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        // Clerk v6+: clerkClient is an async function that must be awaited
        const client = await clerkClient();

        const response = await client.users.getUserList({
            limit,
            offset,
            orderBy: '-created_at',
        });

        // Clerk v6 returns { data, totalCount }
        const userList = Array.isArray(response) ? response : (response.data || []);
        const totalCount = response.totalCount || userList.length;

        const users = userList.map((user) => ({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses?.[0]?.emailAddress || '',
            imageUrl: user.imageUrl || '',
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt,
        }));

        return res.status(200).json({
            success: true,
            data: users,
            total: totalCount,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch users',
        });
    }
}
