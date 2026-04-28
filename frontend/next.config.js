/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/bot/:path*",
        destination: "auto-trader-v2-production.up.railway.app",
      },
    ];
  },
};

module.exports = nextConfig;