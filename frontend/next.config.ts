import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:5000";
    return {
      beforeFiles: process.env.PROXY_TO_EXPRESS === "true" ? [
        {
          source: "/api/:path*",
          destination: `${backend}/api/:path*`,
        },
        {
          source: "/health",
          destination: `${backend}/health`,
        },
      ] : [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${backend}/api/:path*`,
        },
        {
          source: "/health",
          destination: `${backend}/health`,
        },
      ],
    };
  },
};

export default nextConfig;
