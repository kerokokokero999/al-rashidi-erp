import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إعدادات Turbopack (زي ما هي)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // إعدادات الـ Standalone (عشان Electron)
  output: "standalone",
};

export default nextConfig;