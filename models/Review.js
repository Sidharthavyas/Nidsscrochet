import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
            index: true,
        },
        // ✅ Link review to authenticated Clerk user for duplicate prevention
        clerkUserId: {
            type: String,
            index: true,
            sparse: true, // old reviews without userId still indexed correctly
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [80, 'Name cannot exceed 80 characters'],
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Fast per-product queries sorted by newest first
ReviewSchema.index({ productId: 1, createdAt: -1 });

// ✅ One review per user per product at DB level (sparse so old reviews are unaffected)
ReviewSchema.index({ productId: 1, clerkUserId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
