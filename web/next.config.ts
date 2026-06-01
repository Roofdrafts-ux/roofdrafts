import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack doesn't walk up and
  // pick a stray parent lockfile (e.g. ~/package-lock.json). `next` runs from
  // this directory, so process.cwd() is the project root.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
