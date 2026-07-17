import { describe, expect, it } from "vitest";

import { InvitationStatus } from "../../../domain/invitation/invitation.entity";
import { Member } from "../../../domain/member/member.entity";
import { Role } from "../../../domain/member/role.vo";
import { Organization } from "../../../domain/organization/organization.entity";
import { User } from "../../../domain/user/user.entity";
import { Email } from "../../../shared/email.vo";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors";
import { FakeClock } from "../../../lib/test-support/fake-clock";
import { FakeEmailSender } from "../../../lib/test-support/fake-email-sender";
import { FakeIdGenerator } from "../../../lib/test-support/fake-id-generator";
import { FakeTokenGenerator } from "../../../lib/test-support/fake-token-generator";
import { FakeTokenHasher } from "../../../lib/test-support/fake-token-hasher";
import { InMemoryInvitationRepository } from "../../../lib/test-support/in-memory-invitation.repository";
import { InMemoryMemberRepository } from "../../../lib/test-support/in-memory-member.repository";
import { InMemoryOrganizationRepository } from "../../../lib/test-support/in-memory-organization.repository";
import { InMemoryUserRepository } from "../../../lib/test-support/in-memory-user.repository";
import { InviteMemberUseCase } from "./invite-member.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup(options: { users?: User[]; members?: Member[] } = {}) {
  const organizations = new InMemoryOrganizationRepository([
    Organization.create({ id: "org-1", name: "Acme", now: NOW }),
  ]);
  const users = new InMemoryUserRepository(options.users ?? []);
  const members = new InMemoryMemberRepository(options.members ?? []);
  const invitations = new InMemoryInvitationRepository();
  const emailSender = new FakeEmailSender();
  const useCase = new InviteMemberUseCase(
    organizations,
    users,
    members,
    invitations,
    new FakeTokenGenerator("tok"),
    new FakeTokenHasher(),
    emailSender,
    new FakeIdGenerator("inv"),
    new FakeClock(NOW),
  );
  return { useCase, invitations, emailSender };
}

const invite = {
  organizationId: "org-1",
  inviterUserId: "owner-1",
  email: "invitee@example.com",
  role: Role.Member,
};

describe("InviteMemberUseCase", () => {
  it("creates a pending invitation and emails the raw token", async () => {
    const { useCase, invitations, emailSender } = setup();

    const invitation = await useCase.execute(invite);

    expect(invitation.status).toBe(InvitationStatus.Pending);
    expect(invitation.email.value).toBe("invitee@example.com");
    expect(invitation.expiresAt.getTime()).toBe(
      NOW.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    expect(await invitations.findById(invitation.id)).not.toBeNull();

    // The raw token went out by email; only its hash is stored.
    expect(emailSender.sentInvitations).toHaveLength(1);
    expect(emailSender.sentInvitations[0]!.token).toBe("tok-1");
    expect(emailSender.sentInvitations[0]!.organizationName).toBe("Acme");
    expect(invitation.tokenHash).toBe("thash:tok-1");
  });

  it("throws NotFoundError when the organization does not exist", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...invite, organizationId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when the invitee is already a member", async () => {
    const invitee = User.create({
      id: "user-9",
      email: new Email("invitee@example.com"),
      name: "Invitee",
      passwordHash: "hashed:pw",
      now: NOW,
    });
    const membership = Member.create({
      id: "m-9",
      organizationId: "org-1",
      userId: "user-9",
      role: Role.Member,
      now: NOW,
    });
    const { useCase } = setup({ users: [invitee], members: [membership] });

    await expect(useCase.execute(invite)).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when an invitation is already pending", async () => {
    const { useCase } = setup();
    await useCase.execute(invite);

    await expect(useCase.execute(invite)).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects inviting someone as Owner", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...invite, role: Role.Owner }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
