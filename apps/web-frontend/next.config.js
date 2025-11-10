/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Enable standalone output for Docker builds */
  output: 'standalone',

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

  /* API proxy configuration */
  // Note: CORS issues should be resolved on the backend (Spring Boot API)
  // This is a proxy for development convenience
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
