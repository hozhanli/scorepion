import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["server/**/*.{test,spec}.ts", "shared/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "server_dist", "static-build", "app/**", "lib/**"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts", "shared/**/*.ts"],
      exclude: ["server/**/*.test.ts", "server/migrations/**"],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@server": path.resolve(__dirname, "server"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
