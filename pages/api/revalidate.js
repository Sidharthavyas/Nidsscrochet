// pages/api/revalidate.js
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Limits revalidations to 10 per minute to prevent quota exhaustion
const rateLimiter = new RateLimiterMemory({
  points: 10, 
  duration: 60,
});

export default async function handler(req, res) {
    // Only allow POST to avoid accidental browser triggers
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Use POST request' });
    }

    // ✅ FIX: Only accept secret from Authorization header — never from URL query param
    // (URL query params get logged in server logs, browser history, and referrer headers)
    const secret = req.headers.authorization?.split(' ')[1];
    if (!secret || secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
        // Cost Control: Rate Limiting
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        await rateLimiter.consume(ip);

        // Revalidate Homepage
        await res.revalidate('/');

        return res.status(200).json({ 
            success: true, 
            message: 'Homepage updated',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        const status = err.remainingPoints === 0 ? 429 : 500;
        return res.status(status).json({ 
            success: false, 
            message: err.remainingPoints === 0 ? 'Too many updates, wait a minute' : 'Internal error' 
        });
    }
}
