import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default function handler(req, res) {
  const { method } = req;

  // ===== LOGIN =====
  if (method === 'POST') {
    const { username, password } = req.body;

    // Validate credentials against single admin account
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate JWT token
      const token = jwt.sign(
        {
          username: ADMIN_USERNAME,
          role: 'admin',
          iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      return res.status(200).json({
        success: true,
        user: {
          username: decoded.username,
          role: decoded.role,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    success: false,
    message: `Method ${method} not allowed`,
  });
}