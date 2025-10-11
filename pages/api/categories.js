import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';
import connectDB from '../../lib/mongodb';

// ===== CATEGORY SCHEMA =====
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    icon: {
      type: String,
      default: '🎨',
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// ===== MAIN API HANDLER =====
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

    // ===== GET: Fetch categories (PUBLIC) =====
    if (method === 'GET') {
      const categories = await Category.find({ active: true }).sort({ order: 1, name: 1 });
      
      return res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    }

    // ===== PROTECTED ROUTES - REQUIRE AUTHENTICATION =====
    const auth = verifyToken(req);

    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Admin access required.',
      });
    }

    // ===== POST: Create category (PROTECTED) =====
    if (method === 'POST') {
      const { name, icon, order } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required',
        });
      }

      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      // Check if category already exists
      const existingCategory = await Category.findOne({ 
        $or: [{ name }, { slug }] 
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
      }

      const category = await Category.create({
        name: name.trim(),
        slug,
        icon: icon || '🎨',
        order: order || 0,
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    }

    // ===== PUT: Update category (PROTECTED) =====
    if (method === 'PUT') {
      const { id, name, icon, order, active } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid category ID is required',
        });
      }

      const updates = {};
      
      if (name) {
        updates.name = name.trim();
        updates.slug = name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }
      if (icon !== undefined) updates.icon = icon;
      if (order !== undefined) updates.order = order;
      if (active !== undefined) updates.active = active;

      const category = await Category.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    }

    // ===== DELETE: Remove category (PROTECTED) =====
    if (method === 'DELETE') {
      const { id } = query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid category ID is required',
        });
      }

      const category = await Category.findByIdAndDelete(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: category,
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`,
    });
  } catch (error) {
    console.error('❌ Category API Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
}