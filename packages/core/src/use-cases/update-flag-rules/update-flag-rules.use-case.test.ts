import { describe, expect, it } from "vitest";

import { Flag } from "../../domain/flag/flag.entity";
import { FlagKey } from "../../domain/flag/flag-key.vo";
import { Project } from "../../domain/project/project.entity";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors";
import { FakeClock } from "../../lib/test-support/fake-clock";
import { InMemoryFlagRepository } from "../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../lib/test-support/in-memory-project.repository";
import { UpdateFlagRulesUseCase } from "./update-flag-rules.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const LATER = new Date("2026-07-17T01:00:00.000Z");

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
    Project.create({
      id: "project-1",
      organizationId: "org-1",
      name: "API",
      now: NOW,
    }),
  ]);
  const useCase = new UpdateFlagRulesUseCase(
    flags,
    projects,
    new FakeClock(LATER),
  );
  return { useCase, flags };
}

const validInput = {
  organizationId: "org-1",
  flagId: "flag-1",
  targetingRules: [
    { type: "user-id-list" as const, userIds: ["vip-1", "vip-2"], value: true },
  ],
  rolloutPercentage: 25,
};

describe("UpdateFlagRulesUseCase", () => {
  it("applies the rules and rollout, advancing updatedAt", async () => {
    const { useCase, flags } = setup();
    await useCase.execute(validInput);

    const flag = (await flags.findById("flag-1"))!;
    expect(flag.targetingRules).toHaveLength(1);
    expect(flag.rolloutPercentage.value).toBe(25);
    expect(flag.updatedAt).toBe(LATER);
  });

  it("produces rules that evaluate correctly once the flag is enabled", async () => {
    const { useCase, flags } = setup();
    await useCase.execute(validInput);

    const flag = (await flags.findById("flag-1"))!;
    flag.enable(LATER);
    expect(flag.evaluate({ key: "vip-1" })).toBe(true);
  });

  it("throws ValidationError for an out-of-range rollout", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, rolloutPercentage: 150 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws NotFoundError for an unknown flag", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, flagId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the flag belongs to another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, organizationId: "other-org" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
