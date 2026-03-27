import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Admin-only API route prefixes and the methods that require a valid admin JWT
const ADMIN_ROUTES = ['/api/products', '/api/banner', '/api/coupons', '/api/categories'];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Verify an HS256 JWT using the Web Crypto API (Edge Runtime compatible — no 'jose' needed).
 * Returns true if the signature is valid and the token is not expired.
 */
async function verifyAdminJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        const [headerB64, payloadB64, sigB64] = parts;
        const secret = process.env.JWT_SECRET || '';

        // Import HMAC-SHA256 key
        const keyData = new TextEncoder().encode(secret);
        const key = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );

        // Verify signature
        const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
        // base64url → base64 → binary
        const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, signingInput);
        if (!valid) return false;

        // Check expiry
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return false;

        return true;
    } catch {
        return false;
    }
}

/**
 * Middleware:
 *  1. Runs Clerk session management on every matched request.
 *  2. (M-1) Guards admin API routes at the edge — no admin JWT → 401 before the handler runs.
 *  3. (H-1) Injects a per-request CSP nonce header so inline scripts can drop 'unsafe-inline'.
 */
export default clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;
    const method = req.method;

    // M-1: Block mutating requests to admin-only routes without a valid admin JWT
    if (MUTATING_METHODS.has(method) && ADMIN_ROUTES.some((p) => pathname.startsWith(p))) {
        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized. Admin token required.' }, { status: 401 });
        }

        const valid = await verifyAdminJwt(token);
        if (!valid) {
            return NextResponse.json({ success: false, message: 'Invalid or expired admin token.' }, { status: 401 });
        }
    }

    // H-1: Generate a cryptographic nonce for this request and attach it as a response header.
    // The nonce is consumed by next.config.mjs to build the CSP header.
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const response = NextResponse.next({
        request: {
            headers: new Headers({ ...Object.fromEntries(req.headers), 'x-nonce': nonce }),
        },
    });
    response.headers.set('x-nonce', nonce);
    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

