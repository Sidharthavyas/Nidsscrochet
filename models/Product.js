import mongoose from 'mongoose';

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
        // NEW: Support both single image (backward compatibility) and multiple images
        image: {
            type: String,
            required: function () {
                return !this.images || this.images.length === 0;
            },
        },
        images: {
            type: [String],
            default: [],
        },
        cloudinaryIds: {
            type: [String],
            default: [],
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
        salePrice: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: function (v) {
                    if (!v || v === '') return true; // Allow null/empty
                    // Skip validation if price is not available (during partial updates)
                    if (!this.price) return true;
                    const regularPrice = parseFloat(this.price?.toString().replace(/[^0-9.]/g, '') || '0');
                    const sale = parseFloat(v.toString().replace(/[^0-9.]/g, '') || '0');
                    // Only validate if both prices are valid numbers
                    if (regularPrice === 0) return true;
                    return sale < regularPrice;
                },
                message: 'Sale price must be less than regular price'
            }
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
        shipping_charges: {
            type: Number,
            default: 0,
        },
        cod_available: {
            type: Boolean,
            default: false,
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

// Indexes
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
