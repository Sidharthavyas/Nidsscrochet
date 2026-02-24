import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';
import { verifyToken } from '../../../lib/authMiddleware';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Admin
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No authorization token provided' });
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        await connectDB();

        const { id, stock } = req.body;

        if (!id || stock === undefined) {
            return res.status(400).json({ success: false, message: 'Product ID and stock value are required' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { stock: Number(stock) },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Inventory update error:', error);
        return res.status(500).json({ success: false, message: 'Server error updating inventory' });
    }
}
