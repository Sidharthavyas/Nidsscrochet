import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';
import connectDB from '../../lib/mongodb';
import { validateBannerData, rateLimit } from '../../lib/security';

// Rate limiter: 30 requests per minute
const limiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

// ===== MONGOOSE SCHEMA FOR BANNER =====
const BannerSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Banner text is required'],
            trim: true,
            maxlength: [500, 'Banner text cannot exceed 500 characters'],
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

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
            // Rate limiting check
            const rateLimitResult = limiter(req);
            if (!rateLimitResult.allowed) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter,
                });
            }

            const { text, active } = req.body;

            // Validate and sanitize input
            const validation = validateBannerData({ text, active });

            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validation.errors,
                });
            }

            // Find existing banner or create new one
            let banner = await Banner.findOne();

            if (banner) {
                // Update existing banner with sanitized data
                if (validation.data.text !== undefined) banner.text = validation.data.text;
                if (validation.data.active !== undefined) banner.active = validation.data.active;
                await banner.save();
            } else {
                // Create new banner with sanitized data
                banner = await Banner.create({
                    text: validation.data.text || '',
                    active: validation.data.active !== undefined ? validation.data.active : true,
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
