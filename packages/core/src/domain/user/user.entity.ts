/**
 * User (persisted shape)
 *   id            string
 *   email         Email   — immutable in v1; the login identifier
 *   name          string  — display name
 *   passwordHash  string  — every user authenticates with a password
 *   createdAt     Date
 */

import type { Email } from "../../shared/email.vo";
import { Entity } from "../../shared/entity";
import { ValidationError } from "../../shared/errors";

const MAX_NAME_LENGTH = 100;

export type UserProps = {
  id: string;
  email: Email;
  name: string;
  /** Opaque. Produced by IPasswordHasher outside core; never a plaintext password. */
  passwordHash: string;
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
 *
 * v1 authenticates by email + password only. Every user therefore has a password hash;
 * there is no passwordless account.
 */
export class User extends Entity {
  /** Immutable in v1 and the login identifier. Changing it would be a designed flow, not a setter. */
  readonly email: Email;
  readonly createdAt: Date;

  private _name: string;
  private _passwordHash: string;

  constructor(props: UserProps) {
    super(props.id);

    User.assertValidName(props.name);
    User.assertValidPasswordHash(props.passwordHash);

    this.email = props.email;
    this.createdAt = props.createdAt;
    this._name = props.name;
    this._passwordHash = props.passwordHash;
  }

  /**
   * A brand-new user.
   *
   * `passwordHash` is supplied already hashed — core never hashes anything itself; that
   * is IPasswordHasher's job, in the use-case that calls this.
   */
  static create(input: {
    id: string;
    email: Email;
    name: string;
    passwordHash: string;
    now: Date;
  }): User {
    return new User({
      id: input.id,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      createdAt: input.now,
    });
  }

  get name(): string {
    return this._name;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  /** Replace the password (reset / change). Takes an already-hashed value. */
  setPassword(passwordHash: string): void {
    User.assertValidPasswordHash(passwordHash);
    this._passwordHash = passwordHash;
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

  private static assertValidPasswordHash(passwordHash: string): void {
    if (passwordHash.length === 0) {
      throw new ValidationError("Password hash must not be empty");
    }
  }
}
