import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyToken } from '../../lib/authMiddleware'; // already exists
import connectDB from '../../lib/mongodb';
import Product from '../../models/Product';

const rateLimiter = new RateLimiterMemory({ points: 10, duration: 60 });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Use POST request' });
  }

  // Use the same JWT verification as all other admin routes
  const auth = verifyToken(req);
  if (!auth.valid) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    await rateLimiter.consume(ip);

    // Revalidate homepage
    await res.revalidate('/');

    // Revalidate all active product pages so price/shipping changes take effect immediately
    try {
      await connectDB();
      const products = await Product.find({ active: true }).select('_id').lean();

      const revalidatePromises = products.map((p) =>
        res.revalidate(`/product/${p._id.toString()}`).catch((err) => {
          console.warn(`Revalidation failed for /product/${p._id}:`, err.message);
        })
      );

      await Promise.allSettled(revalidatePromises);
    } catch (dbErr) {
      console.warn('Product page revalidation skipped (non-critical):', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Homepage and product pages updated',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const status = err.remainingPoints === 0 ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.remainingPoints === 0 ? 'Too many updates, wait a minute' : 'Internal error',
    });
  }
}