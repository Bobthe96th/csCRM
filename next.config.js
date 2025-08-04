/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Cloudways deployment
  output: 'standalone',
  experimental: {
    // Enable server actions if needed
  },
  // Ensure API routes work properly
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  // Configure for Cloudways PHP app setup
  env: {
    PORT: process.env.PORT || 3000,
  },
}

module.exports = nextConfig 