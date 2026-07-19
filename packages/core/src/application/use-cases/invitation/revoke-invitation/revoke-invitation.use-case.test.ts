import { describe, expect, it } from "vitest";

import {
  Invitation,
  InvitationStatus,
} from "../../../../domain/invitation/invitation.entity";
import { Role } from "../../../../domain/member/role";
import { InMemoryInvitationRepository } from "../../../../lib/test-support/in-memory-invitation.repository";
import { Email } from "../../../../shared/email.vo";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../../shared/errors";
import { RevokeInvitationUseCase } from "./revoke-invitation.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const EXPIRES = new Date("2026-07-24T00:00:00.000Z");

function pending(): Invitation {
  return Invitation.create({
    id: "inv-1",
    organizationId: "org-1",
    email: new Email("invitee@example.com"),
    role: Role.Member,
    tokenHash: "thash:t",
    invitedByUserId: "owner-1",
    expiresAt: EXPIRES,
    now: NOW,
  });
}

function setup(seed: Invitation[]) {
  const invitations = new InMemoryInvitationRepository(seed);
  return { useCase: new RevokeInvitationUseCase(invitations), invitations };
}

describe("RevokeInvitationUseCase", () => {
  it("revokes a pending invitation", async () => {
    const { useCase, invitations } = setup([pending()]);
    await useCase.execute({ organizationId: "org-1", invitationId: "inv-1" });

    expect((await invitations.findById("inv-1"))!.status).toBe(
      InvitationStatus.Revoked,
    );
  });

  it("throws NotFoundError for an unknown invitation", async () => {
    const { useCase } = setup([]);
    await expect(
      useCase.execute({ organizationId: "org-1", invitationId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the invitation belongs to another organization", async () => {
    const { useCase } = setup([pending()]);
    await expect(
      useCase.execute({ organizationId: "other", invitationId: "inv-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ConflictError when it is no longer pending", async () => {
    const invitation = pending();
    invitation.revoke();
    const { useCase } = setup([invitation]);
    await expect(
      useCase.execute({ organizationId: "org-1", invitationId: "inv-1" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
