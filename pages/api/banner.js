import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';
import connectDB from '../../lib/mongodb';
import Banner from '../../models/Banner';


// ===== API HANDLER =====
export default async function handler(req, res) {
    const { method } = req;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();

        // ===== GET: PUBLIC - Fetch active banner =====
        if (method === 'GET') {
            // Find the most recent active banner (we'll only have one)
            const banner = await Banner.findOne().sort({ updatedAt: -1 });

            return res.status(200).json({
                success: true,
                data: banner || { text: '', active: false },
            });
        }

        // ===== PROTECTED ROUTES - Admin only =====
        const auth = verifyToken(req);

        if (!auth.valid) {
            return res.status(401).json({
                success: false,
                message: '🔐 Unauthorized. Admin access required.',
            });
        }

        // ===== PUT: Update banner =====
        if (method === 'PUT') {
            const { text, active } = req.body;

            // Basic validation
            if (active !== undefined && typeof active !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed: active must be a boolean',
                });
            }

            if (text !== undefined && typeof text === 'string' && text.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed: text must be 500 characters or fewer',
                });
            }

            // Find existing banner or create new one
            let banner = await Banner.findOne();

            if (banner) {
                if (text !== undefined) banner.text = String(text).trim();
                if (active !== undefined) banner.active = active;
                await banner.save();
            } else {
                banner = await Banner.create({
                    text: text ? String(text).trim() : '',
                    active: active !== undefined ? active : true,
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Banner updated successfully',
                data: banner,
            });
        }

        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({
            success: false,
            message: `Method ${method} not allowed`,
        });
    } catch (error) {
        console.error('❌ Banner API Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        });
    }
}
