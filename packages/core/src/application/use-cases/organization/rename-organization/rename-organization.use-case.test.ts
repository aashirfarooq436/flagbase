import { describe, expect, it } from "vitest";

import { Organization } from "../../../../domain/organization/organization.entity";
import { InMemoryOrganizationRepository } from "../../../../lib/test-support/in-memory-organization.repository";
import { NotFoundError, ValidationError } from "../../../../shared/errors";
import { RenameOrganizationUseCase } from "./rename-organization.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const organizations = new InMemoryOrganizationRepository([
    Organization.create({ id: "org-1", name: "Acme", now: NOW }),
  ]);
  return {
    useCase: new RenameOrganizationUseCase(organizations),
    organizations,
  };
}

describe("RenameOrganizationUseCase", () => {
  it("renames the organization", async () => {
    const { useCase, organizations } = setup();
    const org = await useCase.execute({
      organizationId: "org-1",
      name: "Acme Inc",
    });

    expect(org.name).toBe("Acme Inc");
    expect((await organizations.findById("org-1"))!.name).toBe("Acme Inc");
  });

  it("throws NotFoundError for an unknown organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "nope", name: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects an empty name", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "org-1", name: "  " }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
