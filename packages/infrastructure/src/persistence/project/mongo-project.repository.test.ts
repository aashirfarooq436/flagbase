import { Project } from "@flagbase/core";

import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../lib/test-support/mongo-test-env";
import { MongoProjectRepository } from "./mongo-project.repository";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const repository = new MongoProjectRepository();

function makeProject(
  id: string,
  organizationId: string,
  name: string,
): Project {
  return Project.create({ id, organizationId, name, now: NOW });
}

useMongoTestEnv();

describe("MongoProjectRepository", () => {
  it("persists and reloads a project", async () => {
    await repository.save(makeProject("project-1", "org-1", "API"));

    const loaded = await repository.findById("project-1");
    expect(loaded!.organizationId).toBe("org-1");
    expect(loaded!.name).toBe("API");
  });

  it("scopes findByOrganizationId to the given organization", async () => {
    await repository.save(makeProject("a", "org-1", "API"));
    await repository.save(makeProject("b", "org-1", "Web"));
    await repository.save(makeProject("c", "org-2", "Other"));

    expect(await repository.findByOrganizationId("org-1")).toHaveLength(2);
    expect(await repository.findByOrganizationId("org-2")).toHaveLength(1);
  });

  it("updates in place", async () => {
    const project = makeProject("project-1", "org-1", "API");
    await repository.save(project);

    project.rename("Public API");
    await repository.save(project);

    const all = await repository.findByOrganizationId("org-1");
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe("Public API");
  });

  it("deletes a project", async () => {
    await repository.save(makeProject("project-1", "org-1", "API"));
    await repository.delete("project-1");

    expect(await repository.findById("project-1")).toBeNull();
  });
});
