import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Banner text is required'],
            trim: true,
            maxlength: [500, 'Banner text cannot exceed 500 characters'],
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

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
