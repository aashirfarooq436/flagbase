import { describe, expect, it } from "vitest";

import { Flag } from "../../../../domain/flag/flag.entity";
import { FlagKey } from "../../../../domain/flag/flag-key.vo";
import { Project } from "../../../../domain/project/project.entity";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { InMemoryFlagRepository } from "../../../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import { GetFlagUseCase } from "./get-flag.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const flags = new InMemoryFlagRepository([
    Flag.create({
      id: "flag-1",
      projectId: "project-1",
      key: new FlagKey("dark-mode"),
      description: "",
      now: NOW,
    }),
  ]);
  const projects = new InMemoryProjectRepository([
    Project.create({ id: "project-1", organizationId: "org-1", name: "API", now: NOW }),
  ]);
  return { useCase: new GetFlagUseCase(flags, projects) };
}

describe("GetFlagUseCase", () => {
  it("returns the flag", async () => {
    const { useCase } = setup();
    const flag = await useCase.execute({ organizationId: "org-1", flagId: "flag-1" });
    expect(flag.key.value).toBe("dark-mode");
  });

  it("throws NotFoundError for an unknown flag", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "org-1", flagId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError for a flag in another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "other", flagId: "flag-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
