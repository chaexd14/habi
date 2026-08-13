import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lrxwvbwkpwmgnuycjyvp.supabase.co",
      },
    ],
  },
};

export default nextConfig;
