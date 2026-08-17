import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // IIS (public/web.config) reverse-proxies amulet-test.local:8080 -> 127.0.0.1:3000
      // without preserving the original Host header, so Next's Server Actions CSRF
      // check (origin vs x-forwarded-host/host) fails unless the proxied host is allow-listed here.
      allowedOrigins: ["amulet-test.local:8080"],
    },
  },
};

export default nextConfig;
