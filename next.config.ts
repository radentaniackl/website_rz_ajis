import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mengabaikan error TypeScript saat proses build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;