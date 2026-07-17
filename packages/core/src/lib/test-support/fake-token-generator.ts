import type { ITokenGenerator } from "../../application/ports";

/** Generates predictable sequential tokens (`token-1`, `token-2`, …) for tests. */
export class FakeTokenGenerator implements ITokenGenerator {
  private counter = 0;

  constructor(private prefix = "token") {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
