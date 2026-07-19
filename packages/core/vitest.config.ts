import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Cap how many test files run at once. A few files are CPU-heavy property tests
    // (bucketing distribution over 50k subjects, rollout monotonicity over 2000×101
    // iterations); with unbounded parallelism they oversubscribe the cores, slow each
    // other down, and time out — a false failure. Capping the pool keeps several files
    // running in parallel while leaving each enough CPU to finish quickly. Tests within
    // a single file still run sequentially.
    maxWorkers: 4,
    minWorkers: 1,
    // Headroom above the default 5s so a heavy test never times out under some contention.
    testTimeout: 20000,
  },
});
