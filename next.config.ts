import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /v2 home became the home: keep old links to it working.
  async redirects() {
    return [{ source: "/v2", destination: "/", permanent: true }];
  },
};

export default nextConfig;
