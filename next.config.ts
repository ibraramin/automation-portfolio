import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages (fully static site: no SSR/route handlers).
  // `next build` emits plain HTML into `out/`; set the Pages output dir to `out`.
  output: "export",
};

export default nextConfig;
