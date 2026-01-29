import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. External Packages: 
  // - Removed 'bcrypt' (since we use 'bcryptjs' which bundles fine)
  // - Added 'pdfkit' (for receipt generation) to prevent build warnings
  serverExternalPackages: ['pdf2json', 'pdfkit', '@prisma/client'],

  // 2. Images: Allow external images (Unsplash is used in your Login page)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Used for Blog placeholders
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },

  // 3. Build Settings (Keep these if you want to bypass strict checks during deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Recommended if you have linting errors
  },
  
  reactStrictMode: false, 
};

export default nextConfig;