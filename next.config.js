/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable source maps in development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = "source-map";
    }
    return config;
  },
  // Optional: Enable source maps in production (increases bundle size)
  // productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
