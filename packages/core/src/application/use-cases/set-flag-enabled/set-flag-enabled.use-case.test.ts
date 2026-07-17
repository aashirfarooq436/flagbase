import { describe, expect, it } from "vitest";

import { Flag } from "../../../domain/flag/flag.entity";
import { FlagKey } from "../../../domain/flag/flag-key.vo";
import { Project } from "../../../domain/project/project.entity";
import { ForbiddenError, NotFoundError } from "../../../shared/errors";
import { FakeClock } from "../../../lib/test-support/fake-clock";
import { InMemoryFlagRepository } from "../../../lib/test-support/in-memory-flag.repository";
import { InMemoryProjectRepository } from "../../../lib/test-support/in-memory-project.repository";
import { SetFlagEnabledUseCase } from "./set-flag-enabled.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const LATER = new Date("2026-07-17T01:00:00.000Z");

function makeFlag(): Flag {
  return Flag.create({
    id: "flag-1",
    projectId: "project-1",
    key: new FlagKey("dark-mode"),
    description: "",
    now: NOW,
  });
}

function setup() {
  const project = Project.create({
    id: "project-1",
    organizationId: "org-1",
    name: "API",
    now: NOW,
  });
  const flags = new InMemoryFlagRepository([makeFlag()]);
  const useCase = new SetFlagEnabledUseCase(
    flags,
    new InMemoryProjectRepository([project]),
    new FakeClock(LATER),
  );
  return { useCase, flags };
}

describe("SetFlagEnabledUseCase", () => {
  it("enables a flag and advances updatedAt", async () => {
    const { useCase } = setup();
    const flag = await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      enabled: true,
    });

    expect(flag.enabled).toBe(true);
    expect(flag.updatedAt).toBe(LATER);
  });

  it("disables a flag", async () => {
    const { useCase, flags } = setup();
    await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      enabled: true,
    });
    await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      enabled: false,
    });

    expect((await flags.findById("flag-1"))!.enabled).toBe(false);
  });

  it("is idempotent — setting enabled twice leaves it enabled", async () => {
    const { useCase, flags } = setup();
    await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      enabled: true,
    });
    await useCase.execute({
      organizationId: "org-1",
      flagId: "flag-1",
      enabled: true,
    });

    expect((await flags.findById("flag-1"))!.enabled).toBe(true);
  });

  it("throws NotFoundError for an unknown flag", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "org-1",
        flagId: "nope",
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the flag belongs to another organization", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: "other-org",
        flagId: "flag-1",
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
