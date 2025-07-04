/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Enable image optimization */
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  /* Enable React strict mode for better development experience */
  reactStrictMode: true,
  /* Enable SWC minification for faster builds */
  swcMinify: true,
  /* Enable compression for smaller bundle sizes */
  compress: true,
  /* Enable production source maps for better debugging */
  productionBrowserSourceMaps: false,

  /* Add a comment explaining CORS configuration needs to be on the backend */
  // Note: CORS issues need to be resolved on the backend (Spring Boot API)
  // The following is a temporary workaround for development only
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8765/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
