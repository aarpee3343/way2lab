import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ REQUIRED for Prisma + PDF libs in App Router
  serverExternalPackages: ['@prisma/client', 'pdf2json', 'pdfkit'],

  reactStrictMode: false,

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
    return [
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
