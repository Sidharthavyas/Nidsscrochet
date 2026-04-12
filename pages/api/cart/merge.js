import { getAuth } from '@clerk/nextjs/server';
import connectDb from '../../../lib/mongodb';
import Cart from '../../../models/Cart';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDb();
    
    const { items: guestItems } = req.body;
    
    if (!Array.isArray(guestItems)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }
    
    // Transform guest items to use productId
    const transformedGuestItems = guestItems.map(item => ({
      productId: item.id || item.productId,
      name: item.name,
      price: parseFloat(item.price),
      image: item.image,
      quantity: parseInt(item.quantity),
      shipping_charges: parseFloat(item.shipping_charges) || 0,
      cod_available: !!item.cod_available,
    }));
    
    // Get or create user cart
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      // No existing cart - create new one with guest items
      cart = new Cart({
        userId,
        items: transformedGuestItems,
      });
    } else {
      // Merge guest cart with existing user cart
      cart.mergeItems(transformedGuestItems);
    }
    
    await cart.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
      items: cart.items,
    });
    
  } catch (error) {
    console.error('Cart merge error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
