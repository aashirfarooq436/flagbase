import {
  ConflictError,
  Flag,
  FlagKey,
  RolloutPercentage,
  UserIdListRule,
} from "@flagbase/core";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { FlagModel } from "./flag.model";
import { MongoFlagRepository } from "./mongo-flag.repository";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const LATER = new Date("2026-07-17T01:00:00.000Z");

let mongod: MongoMemoryServer;
const repository = new MongoFlagRepository();

function makeFlag(overrides?: {
  id?: string;
  projectId?: string;
  key?: string;
}): Flag {
  return Flag.create({
    id: overrides?.id ?? "flag-1",
    projectId: overrides?.projectId ?? "project-1",
    key: new FlagKey(overrides?.key ?? "dark-mode"),
    description: "controls the dark theme",
    now: NOW,
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Build indexes so the unique (projectId, key) constraint is actually enforced.
  await FlagModel.init();
});

afterEach(async () => {
  await FlagModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("MongoFlagRepository", () => {
  describe("round-trip", () => {
    it("returns null for an unknown id", async () => {
      expect(await repository.findById("nope")).toBeNull();
    });

    it("persists and reloads a flag with every field intact", async () => {
      const flag = makeFlag();
      flag.updateRules(
        [new UserIdListRule(["user-1", "user-2"], true)],
        new RolloutPercentage(25),
        LATER,
      );
      flag.enable(LATER);

      await repository.save(flag);
      const loaded = await repository.findById("flag-1");

      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe("flag-1");
      expect(loaded!.projectId).toBe("project-1");
      expect(loaded!.key.value).toBe("dark-mode");
      expect(loaded!.description).toBe("controls the dark theme");
      expect(loaded!.enabled).toBe(true);
      expect(loaded!.defaultValue).toBe(false);
      expect(loaded!.rolloutPercentage.value).toBe(25);
      expect(loaded!.targetingRules).toHaveLength(1);
      expect(loaded!.createdAt.getTime()).toBe(NOW.getTime());
      expect(loaded!.updatedAt.getTime()).toBe(LATER.getTime());
    });

    it("reloads a flag that evaluates identically to the original", async () => {
      // The real test of the mapper: not that fields look right, but that the
      // reconstructed flag *behaves* the same. Value objects and rules must survive.
      const flag = makeFlag();
      flag.updateRules(
        [new UserIdListRule(["vip-user"], true)],
        RolloutPercentage.none(),
        NOW,
      );
      flag.enable(NOW);

      await repository.save(flag);
      const loaded = await repository.findById("flag-1");

      expect(loaded!.evaluate({ key: "vip-user" })).toBe(true); // hit the rule
      expect(loaded!.evaluate({ key: "random-user" })).toBe(false); // fall through
    });

    it("preserves the disabled kill switch across a round-trip", async () => {
      const flag = makeFlag();
      flag.updateRules(
        [new UserIdListRule(["user-1"], true)],
        RolloutPercentage.full(),
        NOW,
      );
      // left disabled

      await repository.save(flag);
      const loaded = await repository.findById("flag-1");

      expect(loaded!.enabled).toBe(false);
      expect(loaded!.evaluate({ key: "user-1" })).toBe(false);
    });
  });

  describe("save as upsert", () => {
    it("updates an existing flag in place rather than duplicating it", async () => {
      const flag = makeFlag();
      await repository.save(flag);

      flag.enable(LATER);
      flag.changeDescription("now documented", LATER);
      await repository.save(flag);

      const all = await repository.findByProjectId("project-1");
      expect(all).toHaveLength(1);
      expect(all[0]!.enabled).toBe(true);
      expect(all[0]!.description).toBe("now documented");
    });
  });

  describe("lookups", () => {
    it("finds by project and key", async () => {
      await repository.save(makeFlag());

      const found = await repository.findByProjectAndKey(
        "project-1",
        new FlagKey("dark-mode"),
      );
      expect(found!.id).toBe("flag-1");
    });

    it("scopes findByProjectId to the given project", async () => {
      await repository.save(
        makeFlag({ id: "a", projectId: "project-1", key: "flag-a" }),
      );
      await repository.save(
        makeFlag({ id: "b", projectId: "project-1", key: "flag-b" }),
      );
      await repository.save(
        makeFlag({ id: "c", projectId: "project-2", key: "flag-c" }),
      );

      const forProject1 = await repository.findByProjectId("project-1");
      expect(forProject1).toHaveLength(2);
    });
  });

  describe("uniqueness", () => {
    it("rejects a second flag with the same key in the same project as a ConflictError", async () => {
      await repository.save(makeFlag({ id: "first", key: "dark-mode" }));

      await expect(
        repository.save(makeFlag({ id: "second", key: "dark-mode" })),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("allows the same key in different projects", async () => {
      await repository.save(
        makeFlag({ id: "a", projectId: "project-1", key: "dark-mode" }),
      );

      await expect(
        repository.save(
          makeFlag({ id: "b", projectId: "project-2", key: "dark-mode" }),
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("removes a flag", async () => {
      await repository.save(makeFlag());
      await repository.delete("flag-1");

      expect(await repository.findById("flag-1")).toBeNull();
    });
  });
});
