import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // mongodb-memory-server downloads a Mongo binary on first run and spins up a
    // replica set per test file — both far slower than a pure unit test, hence the
    // raised limits.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // Each test file starts its own in-memory replica set (a real mongod process),
    // which is memory- and CPU-heavy. Cap the pool so we don't run many replica sets at
    // once — this matters most when `pnpm test` runs core and infrastructure together.
    maxWorkers: 2,
    minWorkers: 1,
  },
});
