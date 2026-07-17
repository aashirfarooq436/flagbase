import { describe, expect, it } from "vitest";

import { Flag } from "../../../../domain/flag/flag.entity";
import { FlagKey } from "../../../../domain/flag/flag-key.vo";
import { RolloutPercentage } from "../../../../domain/flag/rollout-percentage.vo";
import { UserIdListRule } from "../../../../domain/flag/targeting-rule";
import { Project } from "../../../../domain/project/project.entity";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { InMemoryFlagRepository } from "../../../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../../../lib/test-support/in-memory-project.repository";
import { EvaluateFlagUseCase } from "./evaluate-flag.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const flag = Flag.create({
    id: "flag-1",
    projectId: "project-1",
    key: new FlagKey("dark-mode"),
    description: "",
    now: NOW,
  });
  flag.updateRules(
    [new UserIdListRule(["vip-1"], true)],
    RolloutPercentage.none(),
    NOW,
  );
  flag.enable(NOW);

  const useCase = new EvaluateFlagUseCase(
    new InMemoryFlagRepository([flag]),
    new InMemoryProjectRepository([
      Project.create({
        id: "project-1",
        organizationId: "org-1",
        name: "API",
        now: NOW,
      }),
    ]),
  );
  return { useCase };
}

describe("EvaluateFlagUseCase", () => {
  it("returns true for a subject the rule targets", async () => {
    const { useCase } = setup();
    const result = await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      context: { key: "vip-1" },
    });
    expect(result).toBe(true);
  });

  it("returns false for a subject that falls through", async () => {
    const { useCase } = setup();
    const result = await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      context: { key: "random-user" },
    });
    expect(result).toBe(false);
  });

  it("throws NotFoundError for an unknown flag", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "org-1",
        flagId: "nope",
        context: { key: "vip-1" },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the flag belongs to another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "other-org",
        flagId: "flag-1",
        context: { key: "vip-1" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
