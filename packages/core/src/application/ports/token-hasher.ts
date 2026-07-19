/**
 * Hashes high-entropy secrets — invitation tokens, and project API keys in v2.
 *
 * Distinct from IPasswordHasher for a security reason, not tidiness. Passwords are
 * low-entropy and need deliberately slow hashing to resist brute force. These are 32
 * bytes of randomness, where a fast hash (SHA-256) is sufficient. It matters concretely
 * in v2: every SDK poll authenticates an API key, so a slow hash there would burn ~100ms
 * of CPU per request, per customer instance, for no security gain.
 *
 * Synchronous because a fast hash has no reason to be otherwise.
 */
export interface ITokenHasher {
  hash(token: string): string;
  verify(token: string, hash: string): boolean;
}
