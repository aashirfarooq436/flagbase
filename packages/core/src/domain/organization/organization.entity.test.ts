import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { Organization } from "./organization.entity";

const NOW = new Date("2026-07-17T00:00:00.000Z");

describe("Organization", () => {
  it("creates with a name and timestamp", () => {
    const org = Organization.create({ id: "org-1", name: "Acme", now: NOW });
    expect(org.name).toBe("Acme");
    expect(org.createdAt).toBe(NOW);
  });

  it("rejects an empty name", () => {
    expect(() =>
      Organization.create({ id: "org-1", name: "  ", now: NOW }),
    ).toThrow(ValidationError);
  });

  it("rejects a name beyond the length limit", () => {
    expect(() =>
      Organization.create({ id: "org-1", name: "x".repeat(101), now: NOW }),
    ).toThrow(ValidationError);
  });

  it("renames", () => {
    const org = Organization.create({ id: "org-1", name: "Acme", now: NOW });
    org.rename("Acme Inc");
    expect(org.name).toBe("Acme Inc");
  });

  it("validates on rename", () => {
    const org = Organization.create({ id: "org-1", name: "Acme", now: NOW });
    expect(() => org.rename("")).toThrow(ValidationError);
  });
});
