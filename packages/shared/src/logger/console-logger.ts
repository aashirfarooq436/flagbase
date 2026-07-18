import type { LogContext, Logger, LogLevel } from "./logger";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// Wrapped rather than referenced directly so the call stays bound to `console`.
const SINK: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export interface ConsoleLoggerOptions {
  /** Lines below this level are dropped. Default: "debug" when pretty, else "info". */
  minLevel?: LogLevel;
  /** Human-readable single lines (local dev) vs one JSON object per line (prod). Default: true. */
  pretty?: boolean;
  /** Context merged into every line this logger emits. */
  context?: LogContext;
}

/**
 * The default Logger: writes to the process console. Pretty, single-line output for local
 * development; one structured JSON object per line in production, so a log collector can parse
 * it. Zero dependencies — works unchanged in Node (server) and the browser (client).
 */
export class ConsoleLogger implements Logger {
  private readonly minLevel: LogLevel;
  private readonly pretty: boolean;
  private readonly context: LogContext;

  constructor(options: ConsoleLoggerOptions = {}) {
    this.pretty = options.pretty ?? true;
    this.minLevel = options.minLevel ?? (this.pretty ? "debug" : "info");
    this.context = options.context ?? {};
  }

  debug(message: string, context?: LogContext): void {
    this.emit("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.emit("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.emit("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.emit("error", message, context);
  }

  child(context: LogContext): Logger {
    return new ConsoleLogger({
      minLevel: this.minLevel,
      pretty: this.pretty,
      context: { ...this.context, ...context },
    });
  }

  private emit(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.minLevel]) {
      return;
    }
    const merged = { ...this.context, ...context };
    const hasContext = Object.keys(merged).length > 0;

    if (this.pretty) {
      const line = `${level.toUpperCase().padEnd(5)} ${message}`;
      if (hasContext) {
        SINK[level](line, merged);
      } else {
        SINK[level](line);
      }
    } else {
      SINK[level](
        JSON.stringify(
          hasContext ? { level, message, context: merged } : { level, message },
        ),
      );
    }
  }
}

/** A Logger that drops everything — for tests, or to silence a subsystem. */
export class NoopLogger implements Logger {
  debug(_message: string, _context?: LogContext): void {}
  info(_message: string, _context?: LogContext): void {}
  warn(_message: string, _context?: LogContext): void {}
  error(_message: string, _context?: LogContext): void {}
  child(_context: LogContext): Logger {
    return this;
  }
}
