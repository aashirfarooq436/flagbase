export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured data attached to a log line (request id, user id, module, …). */
export type LogContext = Record<string, unknown>;

/**
 * A technical logger.
 *
 * An interface, not a class, so every consumer depends on the *capability* and the concrete
 * sink (the console now, a hosted collector later) stays swappable. This is a cross-cutting
 * delivery/infrastructure utility, NOT a domain concern — `packages/core` never imports it
 * (the kernel bans runtime globals like `console`). If a domain operation ever needs to record
 * something, that is a separate domain port (audit / events), not this.
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Returns a logger that merges `context` into every line it emits (e.g. per-request). */
  child(context: LogContext): Logger;
}
