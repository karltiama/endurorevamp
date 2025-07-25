import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Suppress the Supabase realtime critical dependency warning
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

export default nextConfig;
