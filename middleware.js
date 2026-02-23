import { clerkMiddleware } from '@clerk/nextjs/server';

// Use the simplest form of clerkMiddleware — no custom logic.
// All routes are public by default. Authentication is handled
// in each page/component using useAuth() or <SignedIn>/<SignedOut>.
// This avoids Edge Runtime issues while still providing Clerk's
// session management and SSO callback handling.
export default clerkMiddleware();

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
