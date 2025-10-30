/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimized for Vercel deployment

  // Enable source maps in development only
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = "source-map";
    }
    return config;
  },

  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    domains: ["vpmlokamxveoskhprxep.supabase.co"],
    formats: ["image/webp", "image/avif"],
  },

  // Enable compression
  compress: true,

  // Optimize bundle (removed experimental optimizeCss as it's causing build issues)
};

module.exports = nextConfig;
