import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
    default: 1,
  },
  shipping_charges: {
    type: Number,
    default: 0,
    min: 0,
  },
  cod_available: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  items: [CartItemSchema],
}, {
  timestamps: true,
});

// Prevent duplicate product entries - merge quantities instead
CartSchema.methods.mergeItems = function(newItems) {
  const itemMap = new Map();
  
  // Add existing items to map
  this.items.forEach(item => {
    itemMap.set(item.productId, {
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      shipping_charges: item.shipping_charges,
      cod_available: item.cod_available,
    });
  });
  
  // Merge new items
  newItems.forEach(item => {
    const existing = itemMap.get(item.productId);
    if (existing) {
      // Update quantity and refresh product data
      existing.quantity = Math.min(existing.quantity + item.quantity, 99);
      existing.price = item.price; // Update to latest price
      existing.name = item.name;
      existing.image = item.image;
      existing.shipping_charges = item.shipping_charges;
      existing.cod_available = item.cod_available;
    } else {
      itemMap.set(item.productId, {
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: Math.min(item.quantity, 99),
        shipping_charges: item.shipping_charges,
        cod_available: item.cod_available,
      });
    }
  });
  
  this.items = Array.from(itemMap.values());
  return this;
};

// Delete the model if it exists to prevent OverwriteModelError
delete mongoose.models.Cart;

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;
