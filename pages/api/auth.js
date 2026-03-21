import { generateToken, verifyToken } from '../../lib/authMiddleware';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('⚠️ WARNING: Admin credentials not configured!');
}

// ✅ FIX: Brute-force protection — 5 attempts per 15 minutes per IP
const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15, // 15 minutes window
  blockDuration: 60 * 15, // block for 15 minutes after limit reached
});

export default async function handler(req, res) {
  const { method } = req;

  // CORS: Only allow the app's own origin, not a wildcard
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
  ].filter(Boolean);
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ===== LOGIN =====
  if (method === 'POST') {
    // ✅ Apply rate limiting before even reading credentials
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    try {
      await loginLimiter.consume(ip);
    } catch (rateLimitRes) {
      const retrySecs = Math.ceil(rateLimitRes.msBeforeNext / 1000) || 900;
      res.setHeader('Retry-After', String(retrySecs));
      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Try again in ${Math.ceil(retrySecs / 60)} minutes.`,
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Validate credentials against admin account
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Reset rate limit counter on successful login
      loginLimiter.delete(ip).catch(() => {});

      const token = generateToken(
        {
          username: ADMIN_USERNAME,
          role: 'admin',
        },
        '7d'
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          username: ADMIN_USERNAME,
          role: 'admin',
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
  }

  // ===== VERIFY TOKEN =====
  if (method === 'GET') {
    const auth = verifyToken(req);

    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: auth.error || 'Invalid or expired token',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        username: auth.user.username,
        role: auth.user.role,
      },
    });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    success: false,
    message: `Method ${method} not allowed`,
  });
}