import { describe, expect, it } from "vitest";

import { Organization } from "../../../../domain/organization/organization.entity";
import { InMemoryOrganizationRepository } from "../../../../lib/test-support/in-memory-organization.repository";
import { NotFoundError } from "../../../../shared/errors";
import { GetOrganizationBySlugUseCase } from "./get-organization-by-slug.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const organizations = new InMemoryOrganizationRepository([
    Organization.create({ id: "org-1", name: "Acme Inc", now: NOW }),
  ]);
  return { useCase: new GetOrganizationBySlugUseCase(organizations) };
}

describe("GetOrganizationBySlugUseCase", () => {
  it("resolves an organization by its slug", async () => {
    const { useCase } = setup();
    const org = await useCase.execute({ slug: "acme-inc" });
    expect(org.id).toBe("org-1");
  });

  it("throws NotFoundError for an unknown slug", async () => {
    const { useCase } = setup();
    await expect(useCase.execute({ slug: "nope" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
