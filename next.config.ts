import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 75 is Next's default; the project covers ask for 90 (ParallaxImage), since
  // the default recompression visibly softens their already-compressed files.
  images: {
    qualities: [75, 90],
    // Image files are renamed whenever they change (…-v2, -v3), so a resized
    // copy never goes stale: keep it a year, instead of re-transforming it
    // (each transformation counts against Vercel's Hobby quota).
    minimumCacheTTL: 31536000,
  },
  // The /v2 home became the home: keep old links to it working.
  async redirects() {
    return [{ source: "/v2", destination: "/", permanent: true }];
  },
};

export default nextConfig;
