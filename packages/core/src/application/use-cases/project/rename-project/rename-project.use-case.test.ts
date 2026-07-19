import { describe, expect, it } from "vitest";

import { Project } from "../../../../domain/project/project.entity";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors";
import { RenameProjectUseCase } from "./rename-project.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const projects = new InMemoryProjectRepository([
    Project.create({
      id: "project-1",
      organizationId: "org-1",
      name: "API",
      now: NOW,
    }),
  ]);
  return { useCase: new RenameProjectUseCase(projects), projects };
}

describe("RenameProjectUseCase", () => {
  it("renames the project", async () => {
    const { useCase, projects } = setup();
    await useCase.execute({
      organizationId: "org-1",
      projectId: "project-1",
      name: "Public API",
    });

    expect((await projects.findById("project-1"))!.name).toBe("Public API");
  });

  it("throws NotFoundError for an unknown project", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "org-1",
        projectId: "nope",
        name: "X",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError for a project in another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "other",
        projectId: "project-1",
        name: "X",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an empty name", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "org-1",
        projectId: "project-1",
        name: " ",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
