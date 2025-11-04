import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["**/*.test.ts", "**/*.spec.ts", "**/*.test.tsx", "**/*.spec.tsx"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/.archive/**",
      "**/dist/**",
      "**/.pnpm/**",
      "**/__tests__/e2e/**/*.spec.ts", // Exclude E2E tests (run with Playwright)
      "**/tests/e2e/**/*.spec.ts", // E2E tests in tests/ directory
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts", "app/server/routers/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.d.ts",
        "lib/db/schema.ts",
        "**/__tests__/**",
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
