/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force unique build ID so Vercel CDN serves fresh chunks
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Prevent aggressive caching on mobile (especially iOS home screen PWAs)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
