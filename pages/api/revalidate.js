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

    // 1. Security: Strict Secret Check
    const secret = req.query.secret || req.headers.authorization?.split(' ')[1];
    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(444).json({ message: 'Invalid token' });
    }

    try {
        // 2. Cost Control: Rate Limiting
        // Prevents a bug in your admin panel from triggering 100s of revalidations
        await rateLimiter.consume(req.socket.remoteAddress);

        // 3. Revalidate Homepage
        // This is the most efficient way to maintain "Fresh" content for FREE
        await res.revalidate('/');

        return res.status(200).json({ 
            success: true, 
            message: 'Homepage updated',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        // If rate limited or Vercel error
        const status = err.remainingPoints === 0 ? 429 : 500;
        return res.status(status).json({ 
            success: false, 
            message: err.remainingPoints === 0 ? 'Too many updates, wait a minute' : 'Internal error' 
        });
    }
}
