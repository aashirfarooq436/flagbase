/** Reads the current time. A port so that expiry logic is testable without waiting. */
export interface IClock {
  now(): Date;
}
