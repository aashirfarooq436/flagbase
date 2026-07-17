import { describe, expect, it } from "vitest";

import { Project } from "../../domain/project/project.entity";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors";
import { FakeClock } from "../../lib/test-support/fake-clock";
import { FakeIdGenerator } from "../../lib/test-support/fake-id-generator";
import { InMemoryFlagRepository } from "../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../lib/test-support/in-memory-project.repository";
import { CreateFlagUseCase } from "./create-flag.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup(seedProjects: Project[] = [projectInOrg()]) {
  const projects = new InMemoryProjectRepository(seedProjects);
  const flags = new InMemoryFlagRepository();
  const useCase = new CreateFlagUseCase(
    projects,
    flags,
    new FakeIdGenerator("flag"),
    new FakeClock(NOW),
  );
  return { useCase, flags };
}

function projectInOrg(): Project {
  return Project.create({
    id: "project-1",
    organizationId: "org-1",
    name: "API",
    now: NOW,
  });
}

const validInput = {
  organizationId: "org-1",
  projectId: "project-1",
  key: "dark-mode",
  description: "controls the dark theme",
};

describe("CreateFlagUseCase", () => {
  it("creates a flag shipped dark and persists it", async () => {
    const { useCase, flags } = setup();

    const flag = await useCase.execute(validInput);

    expect(flag.id).toBe("flag-1");
    expect(flag.key.value).toBe("dark-mode");
    expect(flag.enabled).toBe(false);
    expect(flag.rolloutPercentage.value).toBe(0);
    expect(flag.createdAt).toBe(NOW);
    expect(await flags.findById("flag-1")).not.toBeNull();
  });

  it("honors an explicit defaultValue", async () => {
    const { useCase } = setup();
    const flag = await useCase.execute({ ...validInput, defaultValue: true });
    expect(flag.defaultValue).toBe(true);
  });

  it("throws NotFoundError when the project does not exist", async () => {
    const { useCase } = setup([]);
    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws ForbiddenError when the project belongs to another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, organizationId: "other-org" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ValidationError for a malformed key", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, key: "Dark Mode" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ConflictError when the key already exists in the project", async () => {
    const { useCase } = setup();
    await useCase.execute(validInput);

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("allows the same key under a different project", async () => {
    const other = Project.create({
      id: "project-2",
      organizationId: "org-1",
      name: "Web",
      now: NOW,
    });
    const { useCase } = setup([projectInOrg(), other]);

    await useCase.execute(validInput);
    await expect(
      useCase.execute({ ...validInput, projectId: "project-2" }),
    ).resolves.toBeDefined();
  });
});
