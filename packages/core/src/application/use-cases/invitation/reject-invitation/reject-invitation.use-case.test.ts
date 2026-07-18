import { describe, expect, it } from "vitest";

import {
  Invitation,
  InvitationStatus,
} from "../../../../domain/invitation/invitation.entity";
import { Role } from "../../../../domain/member/role";
import { Email } from "../../../../shared/email.vo";
import { ConflictError, NotFoundError } from "../../../../shared/errors";
import { FakeTokenHasher } from "../../../../lib/test-support/fake-token-hasher";
import { InMemoryInvitationRepository } from "../../../../lib/test-support/in-memory-invitation.repository";
import { RejectInvitationUseCase } from "./reject-invitation.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const EXPIRES = new Date("2026-07-24T00:00:00.000Z");
const TOKEN_HASH = new FakeTokenHasher().hash("raw-token");

function pending(): Invitation {
  return Invitation.create({
    id: "inv-1",
    organizationId: "org-1",
    email: new Email("invitee@example.com"),
    role: Role.Member,
    tokenHash: TOKEN_HASH,
    invitedByUserId: "owner-1",
    expiresAt: EXPIRES,
    now: NOW,
  });
}

function setup(seed: Invitation[]) {
  const invitations = new InMemoryInvitationRepository(seed);
  return {
    useCase: new RejectInvitationUseCase(invitations, new FakeTokenHasher()),
    invitations,
  };
}

describe("RejectInvitationUseCase", () => {
  it("rejects a pending invitation by token", async () => {
    const { useCase, invitations } = setup([pending()]);
    await useCase.execute({ token: "raw-token" });

    expect((await invitations.findById("inv-1"))!.status).toBe(
      InvitationStatus.Rejected,
    );
  });

  it("throws NotFoundError for an unknown token", async () => {
    const { useCase } = setup([pending()]);
    await expect(
      useCase.execute({ token: "wrong-token" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when the invitation is no longer pending", async () => {
    const invitation = pending();
    invitation.accept(NOW);
    const { useCase } = setup([invitation]);
    await expect(
      useCase.execute({ token: "raw-token" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
