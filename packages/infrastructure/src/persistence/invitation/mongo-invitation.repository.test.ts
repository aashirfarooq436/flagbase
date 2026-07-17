import { Email, Invitation, InvitationStatus, Role } from "@flagbase/core";
import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../lib/test-support/mongo-test-env";
import { InvitationModel } from "./mongo-invitation.model";
import { MongoInvitationRepository } from "./mongo-invitation.repository";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const EXPIRES = new Date("2026-07-24T00:00:00.000Z");
const repository = new MongoInvitationRepository();

function makeInvitation(input: {
  id: string;
  organizationId?: string;
  email?: string;
  tokenHash?: string;
}): Invitation {
  return Invitation.create({
    id: input.id,
    organizationId: input.organizationId ?? "org-1",
    email: new Email(input.email ?? "invitee@example.com"),
    role: Role.Member,
    tokenHash: input.tokenHash ?? "token-hash-1",
    invitedByUserId: "user-1",
    expiresAt: EXPIRES,
    now: NOW,
  });
}

useMongoTestEnv(async () => {
  await InvitationModel.init();
});

describe("MongoInvitationRepository", () => {
  it("persists and reloads a pending invitation with all fields", async () => {
    await repository.save(makeInvitation({ id: "inv-1" }));

    const loaded = await repository.findById("inv-1");
    expect(loaded!.organizationId).toBe("org-1");
    expect(loaded!.email.value).toBe("invitee@example.com");
    expect(loaded!.role).toBe(Role.Member);
    expect(loaded!.status).toBe(InvitationStatus.Pending);
    expect(loaded!.expiresAt.getTime()).toBe(EXPIRES.getTime());
    expect(loaded!.acceptedAt).toBeNull();
  });

  it("finds by token hash", async () => {
    await repository.save(
      makeInvitation({ id: "inv-1", tokenHash: "the-token" }),
    );

    const found = await repository.findByTokenHash("the-token");
    expect(found!.id).toBe("inv-1");
  });

  it("finds a pending invitation by organization and email", async () => {
    await repository.save(
      makeInvitation({ id: "inv-1", email: "target@example.com" }),
    );

    const found = await repository.findPendingByOrganizationAndEmail(
      "org-1",
      new Email("Target@Example.com"),
    );
    expect(found!.id).toBe("inv-1");
  });

  it("does not return a non-pending invitation from the pending lookup", async () => {
    const invitation = makeInvitation({
      id: "inv-1",
      email: "target@example.com",
    });
    invitation.revoke();
    await repository.save(invitation);

    const found = await repository.findPendingByOrganizationAndEmail(
      "org-1",
      new Email("target@example.com"),
    );
    expect(found).toBeNull();
  });

  it("persists a status transition and its acceptedAt on update", async () => {
    const invitation = makeInvitation({ id: "inv-1" });
    await repository.save(invitation);

    invitation.accept(NOW);
    await repository.save(invitation);

    const loaded = await repository.findById("inv-1");
    expect(loaded!.status).toBe(InvitationStatus.Accepted);
    expect(loaded!.acceptedAt!.getTime()).toBe(NOW.getTime());
  });

  it("can reload an expired invitation (create-time future check does not block the mapper)", async () => {
    await repository.save(makeInvitation({ id: "inv-1" }));

    const loaded = await repository.findById("inv-1");
    // Now well past expiry — the reconstructed entity reports it correctly.
    expect(loaded!.isExpired(new Date("2026-08-01T00:00:00.000Z"))).toBe(true);
  });
});
