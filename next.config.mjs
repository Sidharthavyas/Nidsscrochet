/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,



  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Disable Vercel's image optimization to save free tier quota
    // We use Cloudinary URL transforms instead
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Configure quality levels to prevent Next.js 16 warning
    qualities: [75, 80, 85, 90, 100],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: 'https://www.Nidsscrochet.in',
  },

  // Compiler optimizations
  compiler: {
    // Removes console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Important for Vercel deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize package imports
    optimizePackageImports: ['framer-motion'],
  },

  // Enable gzip compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // PoweredByHeader disabled for security
  poweredByHeader: false,

  // Security Headers
  async headers() {
    return [
      {
        // Aggressive caching for static assets (images, fonts, icons)
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico|woff|woff2|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            // next/font/google self-hosts fonts — no external font CDN needed
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.Nidsscrochet.in https://challenges.cloudflare.com https://checkout.razorpay.com https://api.razorpay.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: https: blob:;
              font-src 'self' https://checkout.razorpay.com https://fonts.gstatic.com;
              connect-src 'self' https://res.cloudinary.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.Nidsscrochet.in https://clerk-telemetry.com https://challenges.cloudflare.com https://lumberjack.razorpay.com https://api.razorpay.com https://*.juspay.in;
              frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.Nidsscrochet.in https://challenges.cloudflare.com https://*.juspay.in;
              worker-src 'self' blob:;
              frame-ancestors 'self';
              base-uri 'self';
              form-action 'self' https://api.razorpay.com;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ],
      },
    ];
  },
};

export default nextConfig;