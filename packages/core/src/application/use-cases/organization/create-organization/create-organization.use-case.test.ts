import { describe, expect, it } from "vitest";

import { Role } from "../../../../domain/member/role";
import { ValidationError } from "../../../../shared/errors";
import { FakeClock } from "../../../../lib/test-support/fake-clock";
import { FakeIdGenerator } from "../../../../lib/test-support/fake-id-generator";
import { FakeUnitOfWork } from "../../../../lib/test-support/fake-unit-of-work";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { InMemoryOrganizationRepository } from "../../../../lib/test-support/in-memory-organization.repository";
import { CreateOrganizationUseCase } from "./create-organization.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const organizations = new InMemoryOrganizationRepository();
  const members = new InMemoryMemberRepository();
  const unitOfWork = new FakeUnitOfWork({ organizations, members });
  const useCase = new CreateOrganizationUseCase(
    unitOfWork,
    new FakeIdGenerator("id"),
    new FakeClock(NOW),
  );
  return { useCase, organizations, members };
}

describe("CreateOrganizationUseCase", () => {
  it("creates the organization and its owner membership together", async () => {
    const { useCase, organizations, members } = setup();

    const org = await useCase.execute({ name: "Acme", ownerUserId: "user-1" });

    expect(org.name).toBe("Acme");
    expect(await organizations.findById(org.id)).not.toBeNull();

    const owner = await members.findByOrganizationAndUser(org.id, "user-1");
    expect(owner).not.toBeNull();
    expect(owner!.role).toBe(Role.Owner);
  });

  it("gives the new organization exactly one owner", async () => {
    const { useCase, members } = setup();
    const org = await useCase.execute({ name: "Acme", ownerUserId: "user-1" });

    expect(await members.countOwners(org.id)).toBe(1);
  });

  it("rejects an empty name before writing anything", async () => {
    const { useCase, organizations, members } = setup();

    await expect(
      useCase.execute({ name: "  ", ownerUserId: "user-1" }),
    ).rejects.toBeInstanceOf(ValidationError);

    // Validation happens before the transaction — no partial state.
    expect(await organizations.findById("id-1")).toBeNull();
    expect(
      await members.findByOrganizationAndUser("id-1", "user-1"),
    ).toBeNull();
  });
});
