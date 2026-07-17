import type { IIdGenerator } from "../../shared/ports";

/**
 * Generates predictable sequential ids (`id-1`, `id-2`, …) so tests can assert on
 * exact ids instead of matching random UUIDs.
 */
export class FakeIdGenerator implements IIdGenerator {
  private counter = 0;

  constructor(private prefix = "id") {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
