import { describe, expect, it } from "vitest";

import { Flag } from "../../../../domain/flag/flag.entity";
import { FlagKey } from "../../../../domain/flag/flag-key.vo";
import { Project } from "../../../../domain/project/project.entity";
import { InMemoryFlagRepository } from "../../../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../../shared/errors";
import { DeleteProjectUseCase } from "./delete-project.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup(flags: Flag[] = []) {
  const projects = new InMemoryProjectRepository([
    Project.create({
      id: "project-1",
      organizationId: "org-1",
      name: "API",
      now: NOW,
    }),
  ]);
  const flagRepo = new InMemoryFlagRepository(flags);
  return { useCase: new DeleteProjectUseCase(projects, flagRepo), projects };
}

describe("DeleteProjectUseCase", () => {
  it("deletes an empty project", async () => {
    const { useCase, projects } = setup();
    await useCase.execute({ organizationId: "org-1", projectId: "project-1" });

    expect(await projects.findById("project-1")).toBeNull();
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

  it("refuses to delete a project that still has flags", async () => {
    const flag = Flag.create({
      id: "flag-1",
      projectId: "project-1",
      key: new FlagKey("dark-mode"),
      description: "",
      now: NOW,
    });
    const { useCase } = setup([flag]);
    await expect(
      useCase.execute({ organizationId: "org-1", projectId: "project-1" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
