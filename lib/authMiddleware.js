import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('⚠️ WARNING: JWT_SECRET is not defined!');
}

/**
 * Verify JWT token from request headers
 * @param {Object} req - Request object
 * @returns {Object} - { valid: boolean, user?: object, error?: string }
 */
export function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token has expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Middleware to protect API routes
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected handler
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const auth = verifyToken(req);

    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: auth.error || 'Unauthorized',
      });
    }

    // Attach user to request
    req.user = auth.user;

    return handler(req, res);
  };
}

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration (default: 7d)
 * @returns {string} - JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn }
  );
}