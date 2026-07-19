import type { ITokenHasher } from "../../application/ports";

/**
 * A deterministic token hasher for tests. Not secure (SHA-256 is infrastructure's job);
 * this only needs to round-trip predictably so invitation-token lookups match.
 */
export class FakeTokenHasher implements ITokenHasher {
  hash(token: string): string {
    return `thash:${token}`;
  }

  verify(token: string, hash: string): boolean {
    return hash === `thash:${token}`;
  }
}
