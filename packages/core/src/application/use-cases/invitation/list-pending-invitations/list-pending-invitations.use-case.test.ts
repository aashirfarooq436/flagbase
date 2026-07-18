import { describe, expect, it } from "vitest";

import { Invitation } from "../../../../domain/invitation/invitation.entity";
import { Role } from "../../../../domain/member/role";
import { Email } from "../../../../shared/email.vo";
import { InMemoryInvitationRepository } from "../../../../lib/test-support/in-memory-invitation.repository";
import { ListPendingInvitationsUseCase } from "./list-pending-invitations.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const EXPIRES = new Date("2026-07-24T00:00:00.000Z");

function invitation(id: string, email: string, tokenHash: string): Invitation {
  return Invitation.create({
    id,
    organizationId: "org-1",
    email: new Email(email),
    role: Role.Member,
    tokenHash,
    invitedByUserId: "owner-1",
    expiresAt: EXPIRES,
    now: NOW,
  });
}

describe("ListPendingInvitationsUseCase", () => {
  it("returns only pending invitations for the organization", async () => {
    const revoked = invitation("i-2", "b@example.com", "h2");
    revoked.revoke();
    const invitations = new InMemoryInvitationRepository([
      invitation("i-1", "a@example.com", "h1"),
      revoked,
    ]);
    const useCase = new ListPendingInvitationsUseCase(invitations);

    const result = await useCase.execute({ organizationId: "org-1" });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("i-1");
  });
});
