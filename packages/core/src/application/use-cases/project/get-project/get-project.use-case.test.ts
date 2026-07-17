import { describe, expect, it } from "vitest";

import { Project } from "../../../../domain/project/project.entity";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import { GetProjectUseCase } from "./get-project.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const projects = new InMemoryProjectRepository([
    Project.create({ id: "project-1", organizationId: "org-1", name: "API", now: NOW }),
  ]);
  return { useCase: new GetProjectUseCase(projects) };
}

describe("GetProjectUseCase", () => {
  it("returns the project", async () => {
    const { useCase } = setup();
    const project = await useCase.execute({ organizationId: "org-1", projectId: "project-1" });
    expect(project.name).toBe("API");
  });

  it("throws NotFoundError for an unknown project", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "org-1", projectId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError for a project in another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "other", projectId: "project-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
