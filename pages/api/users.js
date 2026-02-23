// pages/api/users.js
// Fetch registered users from Clerk for admin dashboard

import { clerkClient } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (token !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const response = await clerkClient.users.getUserList({
            limit,
            offset,
            orderBy: '-created_at',
        });

        // Clerk v5+ returns { data, totalCount }; v4 returns array directly
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
