import type { IClock } from "../../shared/ports";

/**
 * A clock the test controls. Returns a fixed time until moved, so expiry and
 * timestamp assertions are deterministic instead of racing the wall clock.
 */
export class FakeClock implements IClock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  set(date: Date): void {
    this.current = date;
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
