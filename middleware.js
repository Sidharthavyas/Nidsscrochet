import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that REQUIRE authentication
const isProtectedRoute = createRouteMatcher([
    '/checkout(.*)',
    '/account(.*)',
]);

// Define routes that are always public (no auth required)
const isPublicRoute = createRouteMatcher([
    '/',
    '/login(.*)',
    '/signup(.*)',
    '/cart(.*)',
    '/product(.*)',
    '/api/products(.*)',
    '/api/categories(.*)',
    '/api/reviews(.*)',
    '/api/banner(.*)',
    '/order-success(.*)',
    '/sitemap.xml',
    '/manifest.json',
    '/rose.webp',
    '/favicon.ico',
]);

export default clerkMiddleware(async (auth, req) => {
    // Protect only the routes that need authentication
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
