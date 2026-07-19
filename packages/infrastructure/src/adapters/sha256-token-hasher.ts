import { createHash, timingSafeEqual } from "node:crypto";

import type { ITokenHasher } from "@flagbase/core";

/**
 * ITokenHasher backed by SHA-256.
 *
 * Fast (unlike the password hasher) because the inputs are already high-entropy tokens,
 * not guessable passwords. `verify` uses a constant-time comparison so a timing side
 * channel can't leak how much of a hash matched.
 */
export class Sha256TokenHasher implements ITokenHasher {
  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  verify(token: string, hash: string): boolean {
    const computed = Buffer.from(this.hash(token));
    const expected = Buffer.from(hash);
    if (computed.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(computed, expected);
  }
}
