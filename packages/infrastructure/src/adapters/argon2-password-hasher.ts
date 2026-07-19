import type { IPasswordHasher } from "@flagbase/core";

import argon2 from "argon2";

/**
 * IPasswordHasher backed by argon2 (argon2id by default) — deliberately slow and
 * memory-hard to resist brute-forcing low-entropy passwords.
 */
export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // A malformed stored hash means "not a match", not a crash.
      return false;
    }
  }
}
