import type { IPasswordHasher } from "../../application/ports";

/**
 * A deterministic password hasher for tests — `verify` matches iff `hash` produced the
 * value. Not remotely secure (that's argon2's job in infrastructure); this only needs
 * to round-trip predictably so use-case tests can assert on credential logic.
 */
export class FakePasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
