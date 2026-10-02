import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 75 is Next's default; the project covers ask for 90 (ParallaxImage), since
  // the default recompression visibly softens their already-compressed files.
  images: { qualities: [75, 90] },
  // The /v2 home became the home: keep old links to it working.
  async redirects() {
    return [{ source: "/v2", destination: "/", permanent: true }];
  },
};

export default nextConfig;
