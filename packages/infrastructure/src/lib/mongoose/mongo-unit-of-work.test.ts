import { Member, Organization, Role } from "@flagbase/core";

import { describe, expect, it } from "vitest";

import { MongoMemberRepository } from "../../persistence/member/mongo-member.repository";
import { MongoOrganizationRepository } from "../../persistence/organization/mongo-organization.repository";
import { useMongoTestEnv } from "../test-support/mongo-test-env";
import { MongoUnitOfWork } from "./mongo-unit-of-work";

const NOW = new Date("2026-07-17T00:00:00.000Z");

const unitOfWork = new MongoUnitOfWork();
// Non-transactional repositories to assert on the committed state from outside.
const organizations = new MongoOrganizationRepository();
const members = new MongoMemberRepository();

function makeOrg(): Organization {
  return Organization.create({ id: "org-1", name: "Acme", now: NOW });
}

function makeOwner(): Member {
  return Member.create({
    id: "member-1",
    organizationId: "org-1",
    userId: "user-1",
    role: Role.Owner,
    now: NOW,
  });
}

useMongoTestEnv();

describe("MongoUnitOfWork", () => {
  it("commits every write when the work succeeds", async () => {
    await unitOfWork.run(async (repos) => {
      await repos.organizations.save(makeOrg());
      await repos.members.save(makeOwner());
    });

    expect(await organizations.findById("org-1")).not.toBeNull();
    expect(await members.findById("member-1")).not.toBeNull();
  });

  it("rolls back the first write when a later step throws", async () => {
    await expect(
      unitOfWork.run(async (repos) => {
        await repos.organizations.save(makeOrg());
        throw new Error("boom"); // the second write never happens
      }),
    ).rejects.toThrow("boom");

    // The organization write must have been undone — this is the guarantee the
    // in-memory FakeUnitOfWork cannot prove.
    expect(await organizations.findById("org-1")).toBeNull();
  });

  it("returns the work's result", async () => {
    const result = await unitOfWork.run(async (repos) => {
      await repos.organizations.save(makeOrg());
      return "done";
    });

    expect(result).toBe("done");
  });
});
