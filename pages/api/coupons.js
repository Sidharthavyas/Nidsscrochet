import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';
import connectDB from '../../lib/mongodb';
import Coupon from '../../models/Coupon';

export default async function handler(req, res) {
    const { method, query } = req;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();

        // ===== PROTECTED ROUTES - REQUIRE AUTHENTICATION =====
        const auth = verifyToken(req);

        if (!auth.valid) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Admin access required.',
            });
        }

        // ===== GET: Fetch all coupons =====
        if (method === 'GET') {
            const coupons = await Coupon.find({}).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: coupons.length,
                data: coupons,
            });
        }

        // ===== POST: Create coupon =====
        if (method === 'POST') {
            const { code, discountType, discountValue, minOrderValue, isActive, maxUses, validUntil } = req.body;

            if (!code || !discountType || discountValue === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Code, discount type, and value are required',
                });
            }

            const existingCoupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

            if (existingCoupon) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code already exists',
                });
            }

            const coupon = await Coupon.create({
                code: code.trim().toUpperCase(),
                discountType,
                discountValue: Number(discountValue),
                minOrderValue: Number(minOrderValue) || 0,
                isActive: isActive !== undefined ? isActive : true,
                maxUses: maxUses ? Number(maxUses) : null,
                validUntil: validUntil ? new Date(validUntil) : null,
            });

            return res.status(201).json({
                success: true,
                message: 'Coupon created successfully',
                data: coupon,
            });
        }

        // ===== PUT: Update coupon =====
        if (method === 'PUT') {
            const { id, isActive } = req.body;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid coupon ID is required',
                });
            }

            const updates = {};

            if (isActive !== undefined) updates.isActive = isActive;
            // Admin might just want to toggle isActive for now. We can expand this later if needed.

            const coupon = await Coupon.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Coupon updated successfully',
                data: coupon,
            });
        }

        // ===== DELETE: Remove coupon =====
        if (method === 'DELETE') {
            const { id } = query;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid coupon ID is required',
                });
            }

            const coupon = await Coupon.findByIdAndDelete(id);

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Coupon deleted successfully',
                data: coupon,
            });
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
            success: false,
            message: `Method ${method} not allowed`,
        });
    } catch (error) {
        console.error('❌ Coupon API Error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        });
    }
}
