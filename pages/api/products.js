import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import mongoose from 'mongoose';
import { verifyToken } from '../../lib/authMiddleware';
import connectDB from '../../lib/mongodb';
import Product from '../../models/Product';

const unlinkFile = promisify(fs.unlink);

// ===== CLOUDINARY CONFIGURATION =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});




// ===== DISABLE NEXT.JS BODY PARSER =====
export const config = {
  api: {
    bodyParser: false,
  },
};

// ===== HELPER FUNCTIONS =====

const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    const uploadDir = process.env.VERCEL ? '/tmp' : os.tmpdir();

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      multiples: true, // UPDATED: Allow multiple files
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
      uploadDir: uploadDir,
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

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // ===== GET: PUBLIC - NO AUTH REQUIRED =====
    if (method === 'GET') {
      const { category, id, featured, search, sort, limit, page } = query;

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

      let queryFilter = { active: true };

      if (category && category.toLowerCase() !== 'all') {
        queryFilter.category = category;
      }

      if (featured === 'true') {
        queryFilter.featured = true;
      }

      if (search) {
        queryFilter.$text = { $search: search };
      }

      let queryBuilder = Product.find(queryFilter);

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

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 100;
      const skip = (pageNum - 1) * limitNum;

      queryBuilder = queryBuilder.skip(skip).limit(limitNum);

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

    // ===== PROTECTED ROUTES =====
    const auth = verifyToken(req);

    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: '🔐 Unauthorized. Admin access required.',
      });
    }

    // ===== POST: CREATE PRODUCT (UPDATED FOR MULTIPLE IMAGES) =====
    if (method === 'POST') {
      const tempFilePaths = [];

      try {
        console.log('📝 Parsing form data...');
        const { fields, files } = await parseFormData(req);

        // NEW: Handle multiple images
        const imageFiles = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];

        if (imageFiles.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one product image is required',
          });
        }

        if (imageFiles.length > 5) {
          return res.status(400).json({
            success: false,
            message: 'Maximum 5 images allowed',
          });
        }

        // Upload all images to Cloudinary
        const uploadedImages = [];
        const cloudinaryIds = [];

        for (const file of imageFiles) {
          tempFilePaths.push(file.filepath);
          const { url, publicId } = await uploadToCloudinary(file.filepath);
          uploadedImages.push(url);
          cloudinaryIds.push(publicId);
        }

        const productData = {
          category: getFieldValue(fields.category),
          name: getFieldValue(fields.name),
          description: getFieldValue(fields.description),
          price: getFieldValue(fields.price),
          salePrice: getFieldValue(fields.salePrice) || null, // Add sale price
          image: uploadedImages[0], // Primary image (backward compatibility)
          images: uploadedImages, // All images
          cloudinaryId: cloudinaryIds[0], // Primary ID
          cloudinaryIds: cloudinaryIds, // All IDs
          featured: getFieldValue(fields.featured) === 'true',
          stock: parseInt(getFieldValue(fields.stock)) || 0,
        };

        console.log('💾 Creating product:', productData.name);
        const product = await Product.create(productData);

        // Cleanup temp files
        for (const path of tempFilePaths) {
          await cleanupTempFile(path);
        }

        return res.status(201).json({
          success: true,
          message: 'Product created successfully',
          data: product,
        });
      } catch (error) {
        console.error('❌ POST Error:', error);

        // Cleanup temp files on error
        for (const path of tempFilePaths) {
          await cleanupTempFile(path);
        }

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

    // ===== PUT: UPDATE PRODUCT (UPDATED FOR MULTIPLE IMAGES) =====
    if (method === 'PUT') {
      const tempFilePaths = [];

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
        if (fields.salePrice !== undefined) {
          updates.salePrice = getFieldValue(fields.salePrice) || null; // Add/update/remove sale price
        }
        if (fields.featured !== undefined) {
          updates.featured = getFieldValue(fields.featured) === 'true';
        }
        if (fields.stock !== undefined) {
          updates.stock = parseInt(getFieldValue(fields.stock)) || 0;
        }
        if (fields.active !== undefined) {
          updates.active = getFieldValue(fields.active) === 'true';
        }

        // NEW: Handle image updates
        const imageFiles = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];

        if (imageFiles.length > 0) {
          if (imageFiles.length > 5) {
            return res.status(400).json({
              success: false,
              message: 'Maximum 5 images allowed',
            });
          }

          // Upload new images
          const uploadedImages = [];
          const cloudinaryIds = [];

          for (const file of imageFiles) {
            tempFilePaths.push(file.filepath);
            const { url, publicId } = await uploadToCloudinary(file.filepath);
            uploadedImages.push(url);
            cloudinaryIds.push(publicId);
          }

          // Get existing images to keep (from existingImages field)
          let existingImages = [];
          try {
            const existingImagesField = getFieldValue(fields.existingImages);
            if (existingImagesField) {
              existingImages = JSON.parse(existingImagesField);
            }
          } catch (e) {
            console.log('No existing images to preserve');
          }

          // Combine existing + new images
          const allImages = [...existingImages, ...uploadedImages];
          const allIds = [...(existingProduct.cloudinaryIds || []), ...cloudinaryIds];

          // Delete old images that are being replaced
          const imagesToDelete = (existingProduct.cloudinaryIds || []).filter(
            id => !allIds.includes(id)
          );

          for (const publicId of imagesToDelete) {
            await deleteFromCloudinary(publicId);
          }

          updates.images = allImages;
          updates.image = allImages[0]; // Primary image
          updates.cloudinaryIds = allIds;
          updates.cloudinaryId = allIds[0];

          // Cleanup temp files
          for (const path of tempFilePaths) {
            await cleanupTempFile(path);
          }
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

        for (const path of tempFilePaths) {
          await cleanupTempFile(path);
        }

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

    // ===== DELETE: REMOVE PRODUCT (UPDATED TO DELETE ALL IMAGES) =====
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
        // Delete all images from Cloudinary
        const idsToDelete = product.cloudinaryIds && product.cloudinaryIds.length > 0
          ? product.cloudinaryIds
          : [product.cloudinaryId];

        for (const publicId of idsToDelete) {
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
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