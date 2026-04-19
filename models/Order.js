import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    paymentId: {
        type: String,
        default: null,
    },
    signature: {
        type: String,
        default: null,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['pending', 'created', 'paid', 'failed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cod'],
        default: 'online',
    },
    paymentVerified: {
        type: Boolean,
        default: false,
    },
    paidAt: {
        type: Date,
        default: null,
    },
    expiresAt: {
        type: Date,
        default: null,
        index: true,
    },
    shippingCharges: {
        type: Number,
        default: 0,
    },
    couponCode: {
        type: String,
        default: null,
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    items: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
    }],
    isGuest: {
        type: Boolean,
        default: true,
        index: true,
    },
    customer: {
        clerkUserId: { type: String, index: true },
        name: { type: String, required: true },
        email: { type: String, required: true, index: true },
        phone: { type: String, required: true, index: true },
        address: String,
        addressLine1: String,
        city: String,
        state: String,
        pincode: String,
        notes: String,
    },
    // Webhook deduplication
    processedWebhookEvents: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
