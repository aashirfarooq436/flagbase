"use client";

import dynamic from "next/dynamic";

/**
 * Mount point for the dev inspector.
 *
 * In a production build `process.env.NODE_ENV` is the literal `"production"`, so the ternary
 * collapses to `() => null` and the `import("./dev-panel")` sits in a dead branch — the bundler
 * dead-code-eliminates it, so the panel never reaches the client bundle at all (not just hidden).
 */
const DevPanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./dev-panel").then((m) => m.DevPanel), {
        ssr: false,
      })
    : () => null;

export function DevTools() {
  return <DevPanel />;
}
