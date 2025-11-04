/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimized for Vercel deployment

  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vpmlokamxveoskhprxep.supabase.co",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Enable compression
  compress: true,

  // Optimize bundle (removed experimental optimizeCss as it's causing build issues)
};

module.exports = nextConfig;
