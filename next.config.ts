import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ REQUIRED for Prisma + PDF libs in App Router
  serverExternalPackages: ['@prisma/client', 'pdf2json', 'pdfkit'],

  reactStrictMode: false,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
      allowedOrigins: ['waytolab.com', 'www.waytolab.com'],
    },
  },

  images: {
    // Modern & secure
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'your-storage-domain.com' }, // from code-2
    ],
  },

  // ✅ CORS for mobile apps / external clients
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-src 'self'",
          'upgrade-insecure-requests'
        ].join('; ')
      }
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
        ],
      },
    ];
  },

  // ⚠️ Dev convenience (OK for now, remove for prod hardening)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
