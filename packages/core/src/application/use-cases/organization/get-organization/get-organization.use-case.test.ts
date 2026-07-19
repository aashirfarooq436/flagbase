import { describe, expect, it } from "vitest";

import { Organization } from "../../../../domain/organization/organization.entity";
import { InMemoryOrganizationRepository } from "../../../../lib/test-support/in-memory-organization.repository";
import { NotFoundError } from "../../../../shared/errors";
import { GetOrganizationUseCase } from "./get-organization.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const organizations = new InMemoryOrganizationRepository([
    Organization.create({ id: "org-1", name: "Acme", now: NOW }),
  ]);
  return { useCase: new GetOrganizationUseCase(organizations) };
}

describe("GetOrganizationUseCase", () => {
  it("returns the organization", async () => {
    const { useCase } = setup();
    const org = await useCase.execute({ organizationId: "org-1" });
    expect(org.name).toBe("Acme");
  });

  it("throws NotFoundError for an unknown organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
