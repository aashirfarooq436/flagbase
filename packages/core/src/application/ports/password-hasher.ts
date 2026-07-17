/**
 * Hashes user passwords. Deliberately slow (argon2) — see ITokenHasher for why the two
 * are not one port.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
