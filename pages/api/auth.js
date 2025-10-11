import { generateToken, verifyToken } from '../../lib/authMiddleware';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('⚠️ WARNING: Admin credentials not configured!');
}

export default function handler(req, res) {
  const { method } = req;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ===== LOGIN =====
  if (method === 'POST') {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Validate credentials against admin account
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate JWT token
      const token = generateToken(
        {
          username: ADMIN_USERNAME,
          role: 'admin',
        },
        '7d' // Token expires in 7 days
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
      // Invalid credentials
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