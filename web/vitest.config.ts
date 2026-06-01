import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const root = process.cwd();

export default defineConfig({
  resolve: {
    alias: {
      "server-only": resolve(root, "test/stubs/server-only.ts"),
      "@": resolve(root, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
