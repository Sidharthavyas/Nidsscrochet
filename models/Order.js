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
        enum: ['created', 'paid', 'failed', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'created',
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cod'],
        default: 'online',
    },
    shippingCharges: {
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
    customer: {
        clerkUserId: { type: String, index: true },
        name: String,
        email: String,
        phone: String,
        address: String,
        notes: String,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
