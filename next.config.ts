import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async headers() {
    return [
      {
        // Cache static Next.js build assets forever (hashed filenames)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        // Static assets
        source: "/:path*.(svg|png|jpg|jpeg|gif|webp|ico|woff2|woff|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800"
          }
        ]
      },
      {
        // Service worker must NOT be cached
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, no-cache"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
