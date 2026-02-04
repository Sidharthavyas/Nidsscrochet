/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minifier for faster builds
  swcMinify: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Enable image optimization (remove unoptimized for better performance)
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    // Configure quality levels to prevent Next.js 16 warning
    qualities: [75, 80, 85, 90, 100],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: 'https://www.nidsscrochet.in',
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
};

export default nextConfig;