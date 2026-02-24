import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Please provide a coupon code'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: [true, 'Please define the discount type (percentage or fixed)'],
        },
        discountValue: {
            type: Number,
            required: [true, 'Please provide the discount value'],
            min: [0, 'Discount value cannot be negative'],
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        maxUses: {
            type: Number,
            default: null, // null means unlimited
        },
        validUntil: {
            type: Date,
            default: null, // null means no expiration
        }
    },
    { timestamps: true }
);

// Prevent re-compilation of the model if it already exists
export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
