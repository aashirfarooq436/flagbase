import { describe, expect, it } from "vitest";

import { FakeClock } from "../../../../lib/test-support/fake-clock";
import { FakeIdGenerator } from "../../../../lib/test-support/fake-id-generator";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import { ValidationError } from "../../../../shared/errors";
import { CreateProjectUseCase } from "./create-project.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const projects = new InMemoryProjectRepository();
  const useCase = new CreateProjectUseCase(
    projects,
    new FakeIdGenerator("project"),
    new FakeClock(NOW),
  );
  return { useCase, projects };
}

describe("CreateProjectUseCase", () => {
  it("creates a project under the organization", async () => {
    const { useCase, projects } = setup();

    const project = await useCase.execute({
      organizationId: "org-1",
      name: "API",
    });

    expect(project.id).toBe("project-1");
    expect(project.organizationId).toBe("org-1");
    expect(project.name).toBe("API");
    expect(project.createdAt).toBe(NOW);
    expect(await projects.findById("project-1")).not.toBeNull();
  });

  it("rejects an empty name", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ organizationId: "org-1", name: "  " }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
