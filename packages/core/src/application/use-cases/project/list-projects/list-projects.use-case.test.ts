import { describe, expect, it } from "vitest";

import { Project } from "../../../../domain/project/project.entity";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import { ListProjectsUseCase } from "./list-projects.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

describe("ListProjectsUseCase", () => {
  it("returns only the organization's projects", async () => {
    const projects = new InMemoryProjectRepository([
      Project.create({
        id: "a",
        organizationId: "org-1",
        name: "API",
        now: NOW,
      }),
      Project.create({
        id: "b",
        organizationId: "org-1",
        name: "Web",
        now: NOW,
      }),
      Project.create({
        id: "c",
        organizationId: "org-2",
        name: "Other",
        now: NOW,
      }),
    ]);
    const useCase = new ListProjectsUseCase(projects);

    expect(await useCase.execute({ organizationId: "org-1" })).toHaveLength(2);
  });
});
