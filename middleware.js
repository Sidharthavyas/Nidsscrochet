import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const ADMIN_ROUTES = ['/api/products', '/api/banner', '/api/coupons', '/api/categories'];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// These POST/PUT routes are called by regular users — exempt from the admin JWT guard
const PUBLIC_API_EXCEPTIONS = new Set([
  '/api/coupons/validate',
  '/api/orders/cancel',
  '/api/cart',
  '/api/cart/merge',
]);

async function verifyAdminJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, sigB64] = parts;
    const secret = process.env.JWT_SECRET || '';

    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, signingInput);
    if (!valid) return false;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (
    MUTATING_METHODS.has(method) &&
    !PUBLIC_API_EXCEPTIONS.has(pathname) &&
    ADMIN_ROUTES.some((p) => pathname.startsWith(p))
  ) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin token required.' },
        { status: 401 }
      );
    }

    const valid = await verifyAdminJwt(token);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired admin token.' },
        { status: 401 }
      );
    }
  }

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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};