import { getAuth } from '@clerk/nextjs/server';
import connectDb from '../../lib/mongodb';
import Cart from '../../models/Cart';

// Validate cart item structure
const validateCartItem = (item) => {
  if (!item.productId || typeof item.productId !== 'string') {
    throw new Error('Invalid productId');
  }
  if (!item.name || typeof item.name !== 'string') {
    throw new Error('Invalid product name');
  }
  if (typeof item.price !== 'number' || item.price < 0) {
    throw new Error('Invalid price');
  }
  if (!item.image || typeof item.image !== 'string') {
    throw new Error('Invalid image URL');
  }
  if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 99) {
    throw new Error('Invalid quantity');
  }
  return true;
};

export default async function handler(req, res) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDb();
    
    // GET - Fetch user's cart
    if (req.method === 'GET') {
      const cart = await Cart.findOne({ userId });
      
      if (!cart) {
        return res.status(200).json({ items: [] });
      }
      
      return res.status(200).json({ items: cart.items });
    }
    
    // POST - Save/update user's cart (full replacement)
    if (req.method === 'POST') {
      const { items } = req.body;
      
      // Validate input
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Items must be an array' });
      }
      
      // Validate each item
      try {
        items.forEach(validateCartItem);
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      // Transform items to use productId instead of id
      const transformedItems = items.map(item => ({
        productId: item.id || item.productId,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image,
        quantity: parseInt(item.quantity),
        shipping_charges: parseFloat(item.shipping_charges) || 0,
        cod_available: !!item.cod_available,
      }));
      
      // Upsert cart (update if exists, create if not)
      const cart = await Cart.findOneAndUpdate(
        { userId },
        { 
          userId,
          items: transformedItems,
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true,
        }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: 'Cart saved successfully',
        items: cart.items,
      });
    }
    
    // DELETE - Clear user's cart
    if (req.method === 'DELETE') {
      await Cart.findOneAndUpdate(
        { userId },
        { items: [] },
        { upsert: true }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: 'Cart cleared successfully',
        items: [],
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Cart API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
