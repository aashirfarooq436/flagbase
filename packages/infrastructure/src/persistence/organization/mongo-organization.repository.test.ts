import { Organization } from "@flagbase/core";
import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../lib/test-support/mongo-test-env";
import { MongoOrganizationRepository } from "./mongo-organization.repository";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const repository = new MongoOrganizationRepository();

useMongoTestEnv();

describe("MongoOrganizationRepository", () => {
  it("returns null for an unknown id", async () => {
    expect(await repository.findById("nope")).toBeNull();
  });

  it("persists and reloads an organization", async () => {
    await repository.save(
      Organization.create({ id: "org-1", name: "Acme", now: NOW }),
    );

    const loaded = await repository.findById("org-1");
    expect(loaded!.name).toBe("Acme");
    expect(loaded!.createdAt.getTime()).toBe(NOW.getTime());
  });

  it("updates in place rather than duplicating", async () => {
    const org = Organization.create({ id: "org-1", name: "Acme", now: NOW });
    await repository.save(org);

    org.rename("Acme Inc");
    await repository.save(org);

    expect((await repository.findById("org-1"))!.name).toBe("Acme Inc");
  });
});
