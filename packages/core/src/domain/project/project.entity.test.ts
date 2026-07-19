import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { Project } from "./project.entity";

const NOW = new Date("2026-07-17T00:00:00.000Z");

describe("Project", () => {
  it("creates under an organization", () => {
    const project = Project.create({
      id: "project-1",
      organizationId: "org-1",
      name: "API",
      now: NOW,
    });

    expect(project.organizationId).toBe("org-1");
    expect(project.name).toBe("API");
    expect(project.createdAt).toBe(NOW);
  });

  it("rejects an empty name", () => {
    expect(() =>
      Project.create({
        id: "project-1",
        organizationId: "org-1",
        name: " ",
        now: NOW,
      }),
    ).toThrow(ValidationError);
  });

  it("renames", () => {
    const project = Project.create({
      id: "project-1",
      organizationId: "org-1",
      name: "API",
      now: NOW,
    });
    project.rename("Public API");
    expect(project.name).toBe("Public API");
  });
});
