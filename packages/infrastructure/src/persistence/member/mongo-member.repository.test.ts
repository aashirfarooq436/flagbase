import { ConflictError, Member, Role } from "@flagbase/core";
import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../lib/test-support/mongo-test-env";
import { MemberModel } from "./member.model";
import { MongoMemberRepository } from "./mongo-member.repository";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const repository = new MongoMemberRepository();

function makeMember(input: {
  id: string;
  organizationId?: string;
  userId?: string;
  role?: Role;
}): Member {
  return Member.create({
    id: input.id,
    organizationId: input.organizationId ?? "org-1",
    userId: input.userId ?? "user-1",
    role: input.role ?? Role.Member,
    now: NOW,
  });
}

useMongoTestEnv(async () => {
  await MemberModel.init();
});

describe("MongoMemberRepository", () => {
  it("persists and reloads a member with its role", async () => {
    await repository.save(makeMember({ id: "m-1", role: Role.Admin }));

    const loaded = await repository.findById("m-1");
    expect(loaded!.role).toBe(Role.Admin);
    expect(loaded!.organizationId).toBe("org-1");
    expect(loaded!.userId).toBe("user-1");
  });

  it("finds a membership by organization and user", async () => {
    await repository.save(
      makeMember({ id: "m-1", organizationId: "org-1", userId: "user-7" }),
    );

    const found = await repository.findByOrganizationAndUser("org-1", "user-7");
    expect(found!.id).toBe("m-1");
  });

  it("scopes findByOrganizationId to the organization", async () => {
    await repository.save(
      makeMember({ id: "a", organizationId: "org-1", userId: "u1" }),
    );
    await repository.save(
      makeMember({ id: "b", organizationId: "org-1", userId: "u2" }),
    );
    await repository.save(
      makeMember({ id: "c", organizationId: "org-2", userId: "u3" }),
    );

    expect(await repository.findByOrganizationId("org-1")).toHaveLength(2);
  });

  it("finds every membership a user holds", async () => {
    await repository.save(
      makeMember({ id: "a", organizationId: "org-1", userId: "user-7" }),
    );
    await repository.save(
      makeMember({ id: "b", organizationId: "org-2", userId: "user-7" }),
    );
    await repository.save(
      makeMember({ id: "c", organizationId: "org-1", userId: "user-8" }),
    );

    expect(await repository.findByUserId("user-7")).toHaveLength(2);
  });

  it("counts only owners of an organization", async () => {
    await repository.save(
      makeMember({ id: "a", userId: "u1", role: Role.Owner }),
    );
    await repository.save(
      makeMember({ id: "b", userId: "u2", role: Role.Admin }),
    );
    await repository.save(
      makeMember({ id: "c", userId: "u3", role: Role.Member }),
    );

    expect(await repository.countOwners("org-1")).toBe(1);
  });

  it("rejects a duplicate membership for the same user in the same organization", async () => {
    await repository.save(
      makeMember({ id: "first", organizationId: "org-1", userId: "user-1" }),
    );

    await expect(
      repository.save(
        makeMember({ id: "second", organizationId: "org-1", userId: "user-1" }),
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows the same user to belong to different organizations", async () => {
    await repository.save(
      makeMember({ id: "a", organizationId: "org-1", userId: "user-1" }),
    );

    await expect(
      repository.save(
        makeMember({ id: "b", organizationId: "org-2", userId: "user-1" }),
      ),
    ).resolves.not.toThrow();
  });

  it("removes a member", async () => {
    await repository.save(makeMember({ id: "m-1" }));
    await repository.delete("m-1");

    expect(await repository.findById("m-1")).toBeNull();
  });
});
