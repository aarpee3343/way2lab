import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ CRITICAL: Prisma MUST be here for Server Actions to work
  serverExternalPackages: ['@prisma/client', 'pdf2json', 'pdfkit'], 

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },

  reactStrictMode: false, 
};

export default nextConfig;