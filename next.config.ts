import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Two root layouts (site, admin) need a dedicated 404 for unmatched URLs.
  experimental: { globalNotFound: true },
  // Legacy URLs from www.monip-group.com.
  async redirects() {
    return [{ source: "/project-5", destination: "/about", permanent: true }];
  },
  images: {
    localPatterns: [{ pathname: "/api/media/file/**" }],
    // Matches the media files' 1-hour cache (payload.config.ts), so a replaced image shows within the hour.
    minimumCacheTTL: 60 * 60,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
