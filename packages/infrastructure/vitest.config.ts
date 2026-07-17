import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // mongodb-memory-server downloads a Mongo binary on first run and spins one up
    // per test file — both far slower than a pure unit test, hence the raised limits.
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
