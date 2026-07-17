/**
 * User (persisted shape)
 *   id               string
 *   email            Email          — immutable in v1
 *   name             string
 *   passwordHash     string | null  — null for OAuth-only accounts
 *   emailVerifiedAt  Date | null
 *   createdAt        Date
 */

import type { Email } from "../../shared/email.vo";
import { Entity } from "../../shared/entity";
import { ValidationError } from "../../shared/errors";

const MAX_NAME_LENGTH = 100;

export type UserProps = {
  id: string;
  email: Email;
  name: string;
  /** Opaque. Produced by IPasswordHasher; null for users who only ever used OAuth. */
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

/**
 * Someone who logs into the dashboard.
 *
 * Not to be confused with the subject of a flag evaluation — that's the *customer's*
 * end user, modelled as EvaluationContext. Two unrelated people; deliberately two
 * different names.
 *
 * A User exists independently of any organization: signing up creates a User and
 * nothing else, so "signed up, no organization yet" is a real state the dashboard must
 * handle. Membership lives in Member, never as an organizationId here.
 */
export class User extends Entity {
  /** Immutable in v1. It's the account-linking key — changing it is a designed flow, not a setter. */
  readonly email: Email;
  readonly createdAt: Date;

  private _name: string;
  private _passwordHash: string | null;
  private _emailVerifiedAt: Date | null;

  constructor(props: UserProps) {
    super(props.id);

    User.assertValidName(props.name);

    this.email = props.email;
    this.createdAt = props.createdAt;
    this._name = props.name;
    this._passwordHash = props.passwordHash;
    this._emailVerifiedAt = props.emailVerifiedAt;
  }

  /**
   * A brand-new user, unverified.
   *
   * `passwordHash` is supplied already hashed — core never hashes anything itself.
   * Pass null when the account originates from OAuth, where the provider has already
   * proven ownership of the address.
   */
  static create(input: {
    id: string;
    email: Email;
    name: string;
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
    now: Date;
  }): User {
    return new User({
      id: input.id,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      emailVerifiedAt: input.emailVerifiedAt,
      createdAt: input.now,
    });
  }

  get name(): string {
    return this._name;
  }

  get passwordHash(): string | null {
    return this._passwordHash;
  }

  get emailVerifiedAt(): Date | null {
    return this._emailVerifiedAt;
  }

  /**
   * Whether this account's owner has proven they control the address.
   *
   * Load-bearing for security, not a UI nicety: linking an OAuth identity into an
   * *unverified* account is the pre-registration attack (docs/DOMAIN_MODEL.md §4.3).
   * An attacker signs up with a victim's address, the victim later signs in with
   * Google, the accounts merge, and the attacker's password now opens the victim's
   * account. Verification is what makes merging on email safe.
   */
  get isEmailVerified(): boolean {
    return this._emailVerifiedAt !== null;
  }

  get hasPassword(): boolean {
    return this._passwordHash !== null;
  }

  /** Idempotent — a verification link clicked twice keeps the original timestamp. */
  verifyEmail(now: Date): void {
    if (this._emailVerifiedAt === null) {
      this._emailVerifiedAt = now;
    }
  }

  /** Takes an already-hashed value. Hashing is IPasswordHasher's job, outside core. */
  setPassword(passwordHash: string): void {
    if (passwordHash.length === 0) {
      throw new ValidationError("Password hash must not be empty");
    }
    this._passwordHash = passwordHash;
  }

  /**
   * Drop the password, leaving OAuth as the only way in.
   *
   * The caller must confirm at least one OAuth account remains — an entity can't see
   * other rows, so it can't enforce that itself. See docs/DOMAIN_MODEL.md §10.
   */
  removePassword(): void {
    this._passwordHash = null;
  }

  changeName(name: string): void {
    User.assertValidName(name);
    this._name = name;
  }

  private static assertValidName(name: string): void {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      throw new ValidationError("Name must not be empty");
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Name must be at most ${MAX_NAME_LENGTH} characters, received ${trimmed.length}`,
      );
    }
  }
}
