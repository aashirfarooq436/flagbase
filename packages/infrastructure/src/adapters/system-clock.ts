import type { IClock } from "@flagbase/core";

/** IClock backed by the real system time. */
export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
