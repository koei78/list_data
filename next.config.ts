import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local PGlite loads WASM assets through native Node file URLs.
  ...(process.env.NETLIFY_LOCAL_DB === '1' ? {serverExternalPackages: ['@electric-sql/pglite']} : {}),
  // Keep SEO metadata in the initial HTML for all crawlers.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
