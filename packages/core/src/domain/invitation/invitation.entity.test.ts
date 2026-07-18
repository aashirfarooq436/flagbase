import { describe, expect, it } from "vitest";

import { Email } from "../../shared/email.vo";
import { ConflictError, ValidationError } from "../../shared/errors";
import { Role } from "../member/role";
import { Invitation, InvitationStatus } from "./invitation.entity";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const EXPIRES = new Date("2026-07-24T00:00:00.000Z");
const AFTER_EXPIRY = new Date("2026-07-25T00:00:00.000Z");
const BEFORE_EXPIRY = new Date("2026-07-20T00:00:00.000Z");

function makeInvitation(role: Role = Role.Member): Invitation {
  return Invitation.create({
    id: "invite-1",
    organizationId: "org-1",
    email: new Email("invitee@example.com"),
    role,
    tokenHash: "hashed-token",
    invitedByUserId: "user-1",
    expiresAt: EXPIRES,
    now: NOW,
  });
}

describe("Invitation", () => {
  describe("create", () => {
    it("starts pending and unaccepted", () => {
      const invitation = makeInvitation();
      expect(invitation.status).toBe(InvitationStatus.Pending);
      expect(invitation.acceptedAt).toBeNull();
    });

    it("cannot invite someone as Owner — ownership is transferred, not invited", () => {
      expect(() => makeInvitation(Role.Owner)).toThrow(ValidationError);
    });

    it("rejects an expiry that is not in the future", () => {
      expect(() =>
        Invitation.create({
          id: "invite-1",
          organizationId: "org-1",
          email: new Email("invitee@example.com"),
          role: Role.Member,
          tokenHash: "hashed-token",
          invitedByUserId: "user-1",
          expiresAt: NOW, // not after now
          now: NOW,
        }),
      ).toThrow(ValidationError);
    });

    it("rejects an empty token hash", () => {
      expect(() =>
        Invitation.create({
          id: "invite-1",
          organizationId: "org-1",
          email: new Email("invitee@example.com"),
          role: Role.Member,
          tokenHash: "",
          invitedByUserId: "user-1",
          expiresAt: EXPIRES,
          now: NOW,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("expiry (computed, never stored)", () => {
    it("is not expired before the deadline", () => {
      expect(makeInvitation().isExpired(BEFORE_EXPIRY)).toBe(false);
    });

    it("is expired at and after the deadline", () => {
      expect(makeInvitation().isExpired(EXPIRES)).toBe(true);
      expect(makeInvitation().isExpired(AFTER_EXPIRY)).toBe(true);
    });

    it("is acceptable only while pending and unexpired", () => {
      expect(makeInvitation().isAcceptable(BEFORE_EXPIRY)).toBe(true);
      expect(makeInvitation().isAcceptable(AFTER_EXPIRY)).toBe(false);
    });
  });

  describe("accept", () => {
    it("moves a pending invitation to accepted and records the time", () => {
      const invitation = makeInvitation();
      invitation.accept(BEFORE_EXPIRY);

      expect(invitation.status).toBe(InvitationStatus.Accepted);
      expect(invitation.acceptedAt).toBe(BEFORE_EXPIRY);
    });

    it("refuses to accept an expired invitation", () => {
      const invitation = makeInvitation();
      expect(() => invitation.accept(AFTER_EXPIRY)).toThrow(ConflictError);
    });

    it("refuses to accept twice", () => {
      const invitation = makeInvitation();
      invitation.accept(BEFORE_EXPIRY);
      expect(() => invitation.accept(BEFORE_EXPIRY)).toThrow(ConflictError);
    });

    it("refuses to accept a revoked invitation", () => {
      const invitation = makeInvitation();
      invitation.revoke();
      expect(() => invitation.accept(BEFORE_EXPIRY)).toThrow(ConflictError);
    });
  });

  describe("revoke", () => {
    it("moves a pending invitation to revoked", () => {
      const invitation = makeInvitation();
      invitation.revoke();
      expect(invitation.status).toBe(InvitationStatus.Revoked);
    });

    it("refuses to revoke an accepted invitation", () => {
      const invitation = makeInvitation();
      invitation.accept(BEFORE_EXPIRY);
      expect(() => invitation.revoke()).toThrow(ConflictError);
    });

    it("refuses to revoke twice", () => {
      const invitation = makeInvitation();
      invitation.revoke();
      expect(() => invitation.revoke()).toThrow(ConflictError);
    });
  });

  describe("reject", () => {
    it("moves a pending invitation to rejected", () => {
      const invitation = makeInvitation();
      invitation.reject();
      expect(invitation.status).toBe(InvitationStatus.Rejected);
    });

    it("refuses to reject a non-pending invitation", () => {
      const invitation = makeInvitation();
      invitation.accept(BEFORE_EXPIRY);
      expect(() => invitation.reject()).toThrow(ConflictError);
    });
  });
});
