/**
 * Invitation (persisted shape)
 *   id               string
 *   organizationId   string
 *   email            Email             — invitee may not have an account yet
 *   role             Role              — never Owner
 *   tokenHash        string            — raw token lives only in the email
 *   status           InvitationStatus  — pending | accepted | revoked (never "expired")
 *   expiresAt        Date
 *   invitedByUserId  string
 *   createdAt        Date
 *   acceptedAt       Date | null
 */

import type { Email } from "../../shared/email.vo";
import { Entity } from "../../shared/entity";
import { ConflictError, ValidationError } from "../../shared/errors";
import { Role } from "../member/role";

/**
 * Note the absence of `Expired`.
 *
 * Expiry is computed from expiresAt, never stored. Storing it would make an
 * invitation's status depend on whether a background job had run — so the same row
 * would mean different things depending on cron health, and a missed sweep would
 * leave expired invitations quietly acceptable.
 */
export enum InvitationStatus {
  Pending = "pending",
  Accepted = "accepted",
  /** The organization cancelled the invitation. */
  Revoked = "revoked",
  /** The invitee declined the invitation. */
  Rejected = "rejected",
}

export type InvitationProps = {
  id: string;
  organizationId: string;
  email: Email;
  role: Role;
  /** Opaque. The raw token exists only in the email we send. */
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  invitedByUserId: string;
  createdAt: Date;
  acceptedAt: Date | null;
};

/**
 * An offer to join an organization, sent to an email address.
 *
 * Addressed to an *email*, not a userId, because the invitee may not have an account
 * yet — which is exactly the "signed up, no organization" / "no account at all" case.
 * Accepting
 * is therefore two steps: authenticate (signing up if needed), then become a member.
 *
 * The token is stored hashed and appears in cleartext only in the outbound email, the
 * same treatment as a password. A leaked database must not hand out working invite links.
 */
export class Invitation extends Entity {
  readonly organizationId: string;
  readonly email: Email;
  readonly role: Role;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly invitedByUserId: string;
  readonly createdAt: Date;

  private _status: InvitationStatus;
  private _acceptedAt: Date | null;

  constructor(props: InvitationProps) {
    super(props.id);

    Invitation.assertInvitableRole(props.role);

    if (props.tokenHash.length === 0) {
      throw new ValidationError("Invitation token hash must not be empty");
    }

    this.organizationId = props.organizationId;
    this.email = props.email;
    this.role = props.role;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.invitedByUserId = props.invitedByUserId;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._acceptedAt = props.acceptedAt;
  }

  static create(input: {
    id: string;
    organizationId: string;
    email: Email;
    role: Role;
    tokenHash: string;
    invitedByUserId: string;
    expiresAt: Date;
    now: Date;
  }): Invitation {
    if (input.expiresAt.getTime() <= input.now.getTime()) {
      throw new ValidationError("Invitation must expire in the future");
    }

    return new Invitation({
      id: input.id,
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      tokenHash: input.tokenHash,
      status: InvitationStatus.Pending,
      expiresAt: input.expiresAt,
      invitedByUserId: input.invitedByUserId,
      createdAt: input.now,
      acceptedAt: null,
    });
  }

  get status(): InvitationStatus {
    return this._status;
  }

  get acceptedAt(): Date | null {
    return this._acceptedAt;
  }

  isExpired(now: Date): boolean {
    return now.getTime() >= this.expiresAt.getTime();
  }

  /** Pending and still in date — the only state in which accept() will succeed. */
  isAcceptable(now: Date): boolean {
    return this._status === InvitationStatus.Pending && !this.isExpired(now);
  }

  accept(now: Date): void {
    if (this._status !== InvitationStatus.Pending) {
      throw new ConflictError(
        `Invitation cannot be accepted because it is ${this._status}`,
      );
    }

    if (this.isExpired(now)) {
      throw new ConflictError("Invitation has expired");
    }

    this._status = InvitationStatus.Accepted;
    this._acceptedAt = now;
  }

  /** The organization cancels a pending invitation. */
  revoke(): void {
    if (this._status !== InvitationStatus.Pending) {
      throw new ConflictError(
        `Invitation cannot be revoked because it is ${this._status}`,
      );
    }

    this._status = InvitationStatus.Revoked;
  }

  /**
   * The invitee declines a pending invitation. Distinct from revoke() — same effect on a
   * pending invitation, but records that the invitee said no rather than the org pulling it.
   */
  reject(): void {
    if (this._status !== InvitationStatus.Pending) {
      throw new ConflictError(
        `Invitation cannot be rejected because it is ${this._status}`,
      );
    }

    this._status = InvitationStatus.Rejected;
  }

  /**
   * You cannot invite someone as Owner.
   *
   * An organization has exactly one owner, so granting Owner through an invitation would either
   * produce a second one or silently displace the existing one. Transferring ownership
   * is a deliberate, separate operation — not a side effect of an invite email.
   */
  private static assertInvitableRole(role: Role): void {
    if (role === Role.Owner) {
      throw new ValidationError(
        "Cannot invite a member as Owner — ownership is transferred, not invited",
      );
    }
  }
}
