import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import os from 'os'; // ✅ ADDED FOR CROSS-PLATFORM SUPPORT
import { promisify } from 'util';
import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';
import connectDB from '../../lib/mongodb';

const unlinkFile = promisify(fs.unlink);

// ===== CLOUDINARY CONFIGURATION =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

// ===== MONGOOSE SCHEMA =====
const ProductSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    cloudinaryId: {
      type: String,
      default: '',
    },
    price: {
      type: String,
      required: [true, 'Price is required'],
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
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

// Create indexes for faster queries
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ===== DISABLE NEXT.JS BODY PARSER =====
export const config = {
  api: {
    bodyParser: false,
  },
};

// ===== HELPER FUNCTIONS =====

const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    // ✅ FIXED: Use OS-specific temp directory
    // /tmp for Vercel/Linux, C:\Users\...\AppData\Local\Temp for Windows
    const uploadDir = process.env.VERCEL ? '/tmp' : os.tmpdir();
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      uploadDir: uploadDir, // ✅ UPDATED
      filter: function ({ mimetype }) {
        return mimetype && mimetype.includes('image');
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
};

const uploadToCloudinary = async (filePath) => {
  try {
    console.log('📤 Uploading to Cloudinary:', filePath);
    
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'nidsscrochet',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    });

    console.log('✅ Cloudinary upload successful:', result.public_id);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
  }
};

const getFieldValue = (field) => {
  if (Array.isArray(field)) return field[0];
  return field || '';
};

const cleanupTempFile = async (filepath) => {
  try {
    if (filepath && fs.existsSync(filepath)) {
      await unlinkFile(filepath);
      console.log('✅ Temp file cleaned:', filepath);
    }
  } catch (error) {
    console.error('⚠️ Error cleaning up temp file:', error);
  }
};

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
    // Connect to database
    await connectDB();

    // ===== GET: PUBLIC - NO AUTH REQUIRED =====
    if (method === 'GET') {
      const { category, id, featured, search, sort, limit, page } = query;

      // Get single product by ID
      if (id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid product ID',
          });
        }

        const product = await Product.findById(id);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }

        return res.status(200).json({
          success: true,
          data: product,
        });
      }

      // Build query
      let queryFilter = { active: true };

      // Filter by category
      if (category && category.toLowerCase() !== 'all') {
        queryFilter.category = category;
      }

      // Filter by featured
      if (featured === 'true') {
        queryFilter.featured = true;
      }

      // Search functionality
      if (search) {
        queryFilter.$text = { $search: search };
      }

      // Execute query
      let queryBuilder = Product.find(queryFilter);

      // Sorting
      if (sort === 'price-asc') {
        queryBuilder = queryBuilder.sort({ price: 1 });
      } else if (sort === 'price-desc') {
        queryBuilder = queryBuilder.sort({ price: -1 });
      } else if (sort === 'name') {
        queryBuilder = queryBuilder.sort({ name: 1 });
      } else if (sort === 'newest') {
        queryBuilder = queryBuilder.sort({ createdAt: -1 });
      } else {
        queryBuilder = queryBuilder.sort({ createdAt: -1 });
      }

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 100;
      const skip = (pageNum - 1) * limitNum;

      queryBuilder = queryBuilder.skip(skip).limit(limitNum);

      // Execute
      const products = await queryBuilder;
      const total = await Product.countDocuments(queryFilter);

      return res.status(200).json({
        success: true,
        count: products.length,
        total: total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: products,
      });
    }

    // ===== PROTECTED ROUTES - REQUIRE AUTHENTICATION =====
    const auth = verifyToken(req);

    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: '🔐 Unauthorized. Admin access required.',
      });
    }

    // ===== POST: CREATE PRODUCT (PROTECTED) =====
    if (method === 'POST') {
      let tempFilePath = null;

      try {
        console.log('📝 Parsing form data...');
        const { fields, files } = await parseFormData(req);

        if (!files.image) {
          return res.status(400).json({
            success: false,
            message: 'Product image is required',
          });
        }

        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
        tempFilePath = imageFile.filepath;

        console.log('📁 Temp file created at:', tempFilePath);

        const { url: imageUrl, publicId } = await uploadToCloudinary(tempFilePath);

        const productData = {
          category: getFieldValue(fields.category),
          name: getFieldValue(fields.name),
          description: getFieldValue(fields.description),
          price: getFieldValue(fields.price),
          image: imageUrl,
          cloudinaryId: publicId,
          featured: getFieldValue(fields.featured) === 'true',
          stock: parseInt(getFieldValue(fields.stock)) || 0,
        };

        console.log('💾 Creating product:', productData.name);
        const product = await Product.create(productData);

        await cleanupTempFile(tempFilePath);

        return res.status(201).json({
          success: true,
          message: 'Product created successfully',
          data: product,
        });
      } catch (error) {
        console.error('❌ POST Error:', error);
        if (tempFilePath) await cleanupTempFile(tempFilePath);

        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: messages,
          });
        }

        throw error;
      }
    }

    // ===== PUT: UPDATE PRODUCT (PROTECTED) =====
    if (method === 'PUT') {
      let tempFilePath = null;

      try {
        const { fields, files } = await parseFormData(req);

        const productId = getFieldValue(fields.id);

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({
            success: false,
            message: 'Valid product ID is required',
          });
        }

        const existingProduct = await Product.findById(productId);

        if (!existingProduct) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }

        const updates = {};

        if (fields.category) updates.category = getFieldValue(fields.category);
        if (fields.name) updates.name = getFieldValue(fields.name);
        if (fields.description) updates.description = getFieldValue(fields.description);
        if (fields.price) updates.price = getFieldValue(fields.price);
        if (fields.featured !== undefined) {
          updates.featured = getFieldValue(fields.featured) === 'true';
        }
        if (fields.stock !== undefined) {
          updates.stock = parseInt(getFieldValue(fields.stock)) || 0;
        }
        if (fields.active !== undefined) {
          updates.active = getFieldValue(fields.active) === 'true';
        }

        if (files.image) {
          const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
          tempFilePath = imageFile.filepath;

          const { url: newImageUrl, publicId: newPublicId } = await uploadToCloudinary(tempFilePath);

          if (existingProduct.cloudinaryId) {
            await deleteFromCloudinary(existingProduct.cloudinaryId);
          }

          updates.image = newImageUrl;
          updates.cloudinaryId = newPublicId;

          await cleanupTempFile(tempFilePath);
        }

        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { $set: updates },
          { new: true, runValidators: true }
        );

        return res.status(200).json({
          success: true,
          message: 'Product updated successfully',
          data: updatedProduct,
        });
      } catch (error) {
        console.error('❌ PUT Error:', error);
        if (tempFilePath) await cleanupTempFile(tempFilePath);

        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: messages,
          });
        }

        throw error;
      }
    }

    // ===== DELETE: REMOVE PRODUCT (PROTECTED) =====
    if (method === 'DELETE') {
      const { id, permanent } = query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid product ID is required',
        });
      }

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      if (permanent === 'true') {
        if (product.cloudinaryId) {
          await deleteFromCloudinary(product.cloudinaryId);
        }

        await Product.findByIdAndDelete(id);

        return res.status(200).json({
          success: true,
          message: 'Product permanently deleted',
          data: product,
        });
      } else {
        product.active = false;
        await product.save();

        return res.status(200).json({
          success: true,
          message: 'Product deactivated',
          data: product,
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`,
    });
  } catch (error) {
    console.error('❌ API Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
}