import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Docker: genera .next/standalone con server.js y solo las dependencias usadas */
  output: "standalone",
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
