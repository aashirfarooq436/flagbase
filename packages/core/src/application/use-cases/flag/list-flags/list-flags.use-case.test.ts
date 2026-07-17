import { describe, expect, it } from "vitest";

import { Flag } from "../../../../domain/flag/flag.entity";
import { FlagKey } from "../../../../domain/flag/flag-key.vo";
import { Project } from "../../../../domain/project/project.entity";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { InMemoryFlagRepository } from "../../../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import { ListFlagsUseCase } from "./list-flags.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function flag(id: string, projectId: string, key: string): Flag {
  return Flag.create({
    id,
    projectId,
    key: new FlagKey(key),
    description: "",
    now: NOW,
  });
}

function setup() {
  const flags = new InMemoryFlagRepository([
    flag("a", "project-1", "flag-a"),
    flag("b", "project-1", "flag-b"),
    flag("c", "project-2", "flag-c"),
  ]);
  const projects = new InMemoryProjectRepository([
    Project.create({
      id: "project-1",
      organizationId: "org-1",
      name: "API",
      now: NOW,
    }),
    Project.create({
      id: "project-2",
      organizationId: "org-1",
      name: "Web",
      now: NOW,
    }),
  ]);
  return { useCase: new ListFlagsUseCase(flags, projects) };
}

describe("ListFlagsUseCase", () => {
  it("returns only the given project's flags", async () => {
    const { useCase } = setup();
    const result = await useCase.execute({
      organizationId: "org-1",
      projectId: "project-1",
    });
    expect(result).toHaveLength(2);
  });

  it("throws NotFoundError for an unknown project", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "org-1", projectId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the project belongs to another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "other-org", projectId: "project-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
