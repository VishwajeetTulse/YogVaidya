import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent browsers from sniffing MIME type
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent page from being displayed in a frame
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Enable XSS protection in older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict what features can be used
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // CSP for API routes
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
