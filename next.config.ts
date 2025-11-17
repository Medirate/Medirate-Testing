import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "www.gravatar.com",
      "gravatar.com",
      "qpadwftthiuotvnchbvt.supabase.co" // Add your Supabase domain here
    ], // Add the allowed domains here
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during builds
  },
  // Force remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
