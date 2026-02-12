import mongoose from 'mongoose';
import connectDB from '../../lib/mongodb';
import Review from '../../models/Review';
import { verifyToken } from '../../lib/authMiddleware';
import validator from 'validator';

export default async function handler(req, res) {
    await connectDB();

    // ===== GET: Fetch reviews for a product =====
    if (req.method === 'GET') {
        try {
            const { productId } = req.query;

            if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ success: false, message: 'Valid productId is required' });
            }

            const reviews = await Review.find({ productId })
                .sort({ createdAt: -1 })
                .lean();

            // Compute stats
            const reviewCount = reviews.length;
            let averageRating = 0;
            const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

            if (reviewCount > 0) {
                let total = 0;
                reviews.forEach((r) => {
                    total += r.rating;
                    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
                });
                averageRating = Math.round((total / reviewCount) * 10) / 10;
            }

            return res.status(200).json({
                success: true,
                reviews: JSON.parse(JSON.stringify(reviews)),
                averageRating,
                reviewCount,
                distribution,
            });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
        }
    }

    // ===== POST: Submit a new review =====
    if (req.method === 'POST') {
        try {
            const { productId, name, rating, comment } = req.body;

            // Validate productId
            if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ success: false, message: 'Valid productId is required' });
            }

            // Validate name
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Name is required' });
            }
            if (name.trim().length > 80) {
                return res.status(400).json({ success: false, message: 'Name is too long' });
            }

            // Validate rating
            const ratingNum = Number(rating);
            if (!ratingNum || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
                return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
            }

            // Sanitize comment
            const sanitizedComment = comment
                ? validator.escape(validator.trim(comment)).substring(0, 1000)
                : '';
            const sanitizedName = validator.escape(validator.trim(name)).substring(0, 80);

            const review = await Review.create({
                productId,
                name: sanitizedName,
                rating: ratingNum,
                comment: sanitizedComment,
            });

            return res.status(201).json({
                success: true,
                review: JSON.parse(JSON.stringify(review)),
            });
        } catch (error) {
            console.error('Error creating review:', error);
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((e) => e.message);
                return res.status(400).json({ success: false, message: messages.join(', ') });
            }
            return res.status(500).json({ success: false, message: 'Failed to submit review' });
        }
    }

    // ===== DELETE: Admin can delete a review =====
    if (req.method === 'DELETE') {
        try {
            const auth = verifyToken(req);
            if (!auth.valid) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { id } = req.query;
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: 'Valid review id is required' });
            }

            const deleted = await Review.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }

            return res.status(200).json({ success: true, message: 'Review deleted' });
        } catch (error) {
            console.error('Error deleting review:', error);
            return res.status(500).json({ success: false, message: 'Failed to delete review' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
}
