import { describe, expect, it } from "vitest";

import {
  Invitation,
  InvitationStatus,
} from "../../../../domain/invitation/invitation.entity";
import { Member } from "../../../../domain/member/member.entity";
import { Role } from "../../../../domain/member/role";
import { User } from "../../../../domain/user/user.entity";
import { FakeClock } from "../../../../lib/test-support/fake-clock";
import { FakeIdGenerator } from "../../../../lib/test-support/fake-id-generator";
import { FakeTokenHasher } from "../../../../lib/test-support/fake-token-hasher";
import { FakeUnitOfWork } from "../../../../lib/test-support/fake-unit-of-work";
import { InMemoryInvitationRepository } from "../../../../lib/test-support/in-memory-invitation.repository";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { InMemoryUserRepository } from "../../../../lib/test-support/in-memory-user.repository";
import { Email } from "../../../../shared/email.vo";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../../shared/errors";
import { AcceptInvitationUseCase } from "./accept-invitation.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const EXPIRES = new Date("2026-07-24T00:00:00.000Z");
const AFTER_EXPIRY = new Date("2026-07-25T00:00:00.000Z");
const RAW_TOKEN = "raw-token";
const TOKEN_HASH = new FakeTokenHasher().hash(RAW_TOKEN);

function pendingInvitation(email = "invitee@example.com"): Invitation {
  return Invitation.create({
    id: "inv-1",
    organizationId: "org-1",
    email: new Email(email),
    role: Role.Member,
    tokenHash: TOKEN_HASH,
    invitedByUserId: "inviter-1",
    expiresAt: EXPIRES,
    now: NOW,
  });
}

function acceptingUser(email = "invitee@example.com"): User {
  return User.create({
    id: "user-1",
    email: new Email(email),
    name: "Invitee",
    passwordHash: "hashed:pw",
    now: NOW,
  });
}

function setup(options: {
  invitations?: Invitation[];
  users?: User[];
  members?: Member[];
  now?: Date;
}) {
  const invitations = new InMemoryInvitationRepository(
    options.invitations ?? [],
  );
  const users = new InMemoryUserRepository(options.users ?? []);
  const members = new InMemoryMemberRepository(options.members ?? []);
  const unitOfWork = new FakeUnitOfWork({ invitations, users, members });
  const useCase = new AcceptInvitationUseCase(
    unitOfWork,
    new FakeTokenHasher(),
    new FakeIdGenerator("member"),
    new FakeClock(options.now ?? NOW),
  );
  return { useCase, invitations, members };
}

const accept = { token: RAW_TOKEN, acceptingUserId: "user-1" };

describe("AcceptInvitationUseCase", () => {
  it("creates the membership and marks the invitation accepted, together", async () => {
    const { useCase, invitations, members } = setup({
      invitations: [pendingInvitation()],
      users: [acceptingUser()],
    });

    const member = await useCase.execute(accept);

    expect(member.organizationId).toBe("org-1");
    expect(member.userId).toBe("user-1");
    expect(member.role).toBe(Role.Member);
    expect(
      await members.findByOrganizationAndUser("org-1", "user-1"),
    ).not.toBeNull();
    expect((await invitations.findById("inv-1"))!.status).toBe(
      InvitationStatus.Accepted,
    );
  });

  it("throws NotFoundError for an unknown token", async () => {
    const { useCase } = setup({
      invitations: [pendingInvitation()],
      users: [acceptingUser()],
    });
    await expect(
      useCase.execute({ token: "wrong-token", acceptingUserId: "user-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the accepting user's email differs from the invite", async () => {
    const { useCase } = setup({
      invitations: [pendingInvitation("someone@example.com")],
      users: [acceptingUser("different@example.com")],
    });
    await expect(useCase.execute(accept)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws ConflictError when the user is already a member", async () => {
    const existing = Member.create({
      id: "m-existing",
      organizationId: "org-1",
      userId: "user-1",
      role: Role.Member,
      now: NOW,
    });
    const { useCase } = setup({
      invitations: [pendingInvitation()],
      users: [acceptingUser()],
      members: [existing],
    });
    await expect(useCase.execute(accept)).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError for an expired invitation", async () => {
    const { useCase } = setup({
      invitations: [pendingInvitation()],
      users: [acceptingUser()],
      now: AFTER_EXPIRY,
    });
    await expect(useCase.execute(accept)).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError for an already-accepted invitation", async () => {
    const accepted = new Invitation({
      id: "inv-1",
      organizationId: "org-1",
      email: new Email("invitee@example.com"),
      role: Role.Member,
      tokenHash: TOKEN_HASH,
      status: InvitationStatus.Accepted,
      expiresAt: EXPIRES,
      invitedByUserId: "inviter-1",
      createdAt: NOW,
      acceptedAt: NOW,
    });
    const { useCase } = setup({
      invitations: [accepted],
      users: [acceptingUser()],
    });
    await expect(useCase.execute(accept)).rejects.toBeInstanceOf(ConflictError);
  });
});
