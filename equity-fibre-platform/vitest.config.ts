import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globals: true,
    // Integration tests hit the local SQLite dev database.
    env: {
      DATABASE_URL: "file:./prisma/dev.db",
      APP_ENV: "test",
      DEMO_MODE: "true",
      AUTH_SECRET: "dev-only-insecure-change-me",
      FIELD_ENCRYPTION_KEY: "dev-only-insecure-change-me-32byte",
    },
    // Integration tests share the DB, so run serially to avoid interference.
    fileParallelism: false,
  },
});
