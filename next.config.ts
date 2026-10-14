import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone com só o necessário para rodar no Docker.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
