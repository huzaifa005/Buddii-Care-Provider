import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    // Node's fetch needs absolute URLs; MSW (node) intercepts this origin.
    env: { NEXT_PUBLIC_API_URL: "http://localhost/api/v1", NEXT_PUBLIC_API_MOCKING: "disabled" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/components/ui/**", "src/mocks/**", "src/**/*.test.*", "src/test/**"],
    },
  },
})
