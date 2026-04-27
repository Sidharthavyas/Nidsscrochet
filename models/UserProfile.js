import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema(
    {
        clerkUserId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            default: '',
        },
        email: {
            type: String,
            default: '',
            index: true,
        },
        phone: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

export default mongoose.models.UserProfile ||
    mongoose.model('UserProfile', UserProfileSchema);
