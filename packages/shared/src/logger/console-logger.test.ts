import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsoleLogger, NoopLogger } from "./console-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConsoleLogger", () => {
  it("routes each level to the matching console method", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.info("hello");
    logger.error("boom");

    expect(info).toHaveBeenCalledWith("INFO  hello");
    expect(error).toHaveBeenCalledWith("ERROR boom");
  });

  it("drops lines below the minimum level", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = new ConsoleLogger({ minLevel: "warn" });

    logger.debug("quiet");
    logger.warn("loud");

    expect(debug).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("merges child context into every line and keeps the parent untouched", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const base = new ConsoleLogger({ context: { app: "dashboard" } });
    const scoped = base.child({ requestId: "req-1" });

    scoped.info("handled");
    base.info("root");

    expect(info).toHaveBeenNthCalledWith(1, "INFO  handled", {
      app: "dashboard",
      requestId: "req-1",
    });
    expect(info).toHaveBeenNthCalledWith(2, "INFO  root", { app: "dashboard" });
  });

  it("emits one JSON object per line when not pretty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = new ConsoleLogger({ pretty: false });

    logger.warn("degraded", { attempt: 2 });

    expect(warn).toHaveBeenCalledWith(
      JSON.stringify({
        level: "warn",
        message: "degraded",
        context: { attempt: 2 },
      }),
    );
  });

  it("NoopLogger emits nothing and its child is itself", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = new NoopLogger();

    logger.error("ignored");
    logger.child({ a: 1 }).error("also ignored");

    expect(error).not.toHaveBeenCalled();
  });
});
