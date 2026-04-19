import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyToken } from '../../lib/authMiddleware'; // already exists

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

    await res.revalidate('/');

    return res.status(200).json({
      success: true,
      message: 'Homepage updated',
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