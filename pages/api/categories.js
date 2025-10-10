import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || '';
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// Category Schema
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

export default async function handler(req, res) {
  const { method, query } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET: Fetch categories (PUBLIC)
    if (method === 'GET') {
      const categories = await Category.find({ active: true }).sort({ order: 1 });
      return res.status(200).json({
        success: true,
        data: categories,
      });
    }

    // Protected routes - require auth
    const auth = verifyToken(req);
    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // POST: Create category
    if (method === 'POST') {
      const { name, icon, order } = req.body;
      
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      
      const category = await Category.create({
        name,
        slug,
        icon: icon || '🎨',
        order: order || 0,
      });

      return res.status(201).json({
        success: true,
        data: category,
      });
    }

    // PUT: Update category
    if (method === 'PUT') {
      const { id, name, icon, order, active } = req.body;

      const updates = {};
      if (name) {
        updates.name = name;
        updates.slug = name.toLowerCase().replace(/\s+/g, '-');
      }
      if (icon !== undefined) updates.icon = icon;
      if (order !== undefined) updates.order = order;
      if (active !== undefined) updates.active = active;

      const category = await Category.findByIdAndUpdate(id, updates, { new: true });

      return res.status(200).json({
        success: true,
        data: category,
      });
    }

    // DELETE: Remove category
    if (method === 'DELETE') {
      const { id } = query;
      await Category.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Category deleted',
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`,
    });
  } catch (error) {
    console.error('Category API Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}