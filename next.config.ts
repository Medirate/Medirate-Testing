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
  // Note: eslint config removed in Next.js 16 - ESLint is now handled separately
  // Force remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
