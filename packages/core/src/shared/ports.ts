import type { Email } from "./email.vo";

/**
 * Ports — what `core` needs from the outside world, declared as interfaces it owns.
 *
 * The dividing principle: inject what varies by environment, keep pure what must
 * never vary. Ids and time are environmental, so they arrive through ports and tests
 * can fake them. Rollout bucketing must be byte-identical in every process forever,
 * so it stays pure math inside core (see flag/bucketing.ts) and is deliberately NOT
 * a port.
 */

/** Mints entity ids. Implemented with crypto.randomUUID in infrastructure. */
export interface IIdGenerator {
  generate(): string;
}

/** Reads the current time. A port so that expiry logic is testable without waiting. */
export interface IClock {
  now(): Date;
}

/**
 * Mints high-entropy secrets: invitation tokens now, project API keys in v2.
 *
 * Separate from IIdGenerator despite the identical shape. Ids are public and appear
 * in URLs; these are secrets that must be unguessable. Keeping them apart stops the
 * two from being casually swapped at a call site where it would matter.
 */
export interface ITokenGenerator {
  generate(): string;
}

/**
 * Hashes user passwords. Deliberately slow (bcrypt/argon2) — see ITokenHasher for
 * why the two are not one port.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

/**
 * Hashes high-entropy secrets — invitation tokens, and project API keys in v2.
 *
 * Distinct from IPasswordHasher for a security reason, not tidiness. Passwords are
 * low-entropy and need deliberately slow hashing to resist brute force. These are 32
 * bytes of randomness, where a fast hash is sufficient. It matters concretely in v2:
 * every SDK poll authenticates an API key, so bcrypting it would burn ~100ms of CPU
 * per request, per customer instance, for no security gain.
 *
 * Synchronous because a fast hash has no reason to be otherwise.
 */
export interface ITokenHasher {
  hash(token: string): string;
  verify(token: string, hash: string): boolean;
}

/**
 * Sends transactional email.
 *
 * The methods are semantic ("send a verification email") rather than generic ("send
 * this subject and body") on purpose: subject lines and templates are presentation,
 * and presentation does not belong in the domain. core decides *that* a verification
 * email must go out and supplies the token; infrastructure decides what it looks like.
 */
export interface IEmailSender {
  sendEmailVerification(to: Email, token: string): Promise<void>;
  sendInvitation(
    to: Email,
    token: string,
    organizationName: string,
  ): Promise<void>;
}
