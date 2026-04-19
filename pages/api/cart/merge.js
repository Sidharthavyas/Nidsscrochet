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

    // Filter out malformed items so a single bad localStorage entry
    // doesn't block the entire merge and leave the user with an empty cart
    const validGuestItems = guestItems.filter(item => {
      const pid = item.id || item.productId;
      return (
        pid &&
        typeof pid === 'string' &&
        item.name &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        item.price >= 0 &&
        typeof item.quantity === 'number' &&
        item.quantity >= 1 &&
        item.quantity <= 99 &&
        item.image &&
        typeof item.image === 'string'
      );
    });

    // Transform to use productId consistently (frontend uses `id`)
    const transformedGuestItems = validGuestItems.map(item => ({
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
      // No existing cart — create with guest items directly
      cart = new Cart({
        userId,
        items: transformedGuestItems,
      });
    } else {
      // Merge guest items into existing user cart (quantities are summed, capped at 99)
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