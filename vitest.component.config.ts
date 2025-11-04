import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/setup.ts", "./__tests__/react-setup.ts"],
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
      ["**/*.spec.tsx", "jsdom"],
    ],
    include: ["components/ui/__tests__/card-interactive.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: ["components/ui/card-interactive.tsx"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
