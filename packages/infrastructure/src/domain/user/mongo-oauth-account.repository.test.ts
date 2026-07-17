import { ConflictError, OAuthAccount, OAuthProvider } from "@flagbase/core";
import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../test-support/mongo-test-env";
import { MongoOAuthAccountRepository } from "./mongo-oauth-account.repository";
import { OAuthAccountModel } from "./oauth-account.model";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const repository = new MongoOAuthAccountRepository();

function makeAccount(input: {
  id: string;
  userId?: string;
  providerAccountId?: string;
}): OAuthAccount {
  return OAuthAccount.create({
    id: input.id,
    userId: input.userId ?? "user-1",
    provider: OAuthProvider.Google,
    providerAccountId: input.providerAccountId ?? "google-subject-1",
    now: NOW,
  });
}

useMongoTestEnv(async () => {
  await OAuthAccountModel.init();
});

describe("MongoOAuthAccountRepository", () => {
  it("finds a returning account by provider and subject id", async () => {
    await repository.save(
      makeAccount({ id: "oa-1", providerAccountId: "google-42" }),
    );

    const found = await repository.findByProviderAccount(
      OAuthProvider.Google,
      "google-42",
    );
    expect(found!.id).toBe("oa-1");
    expect(found!.userId).toBe("user-1");
  });

  it("lists and counts a user's linked accounts", async () => {
    await repository.save(
      makeAccount({ id: "oa-1", userId: "user-7", providerAccountId: "g-1" }),
    );

    expect(await repository.findByUserId("user-7")).toHaveLength(1);
    expect(await repository.countByUserId("user-7")).toBe(1);
    expect(await repository.countByUserId("nobody")).toBe(0);
  });

  it("rejects linking the same external identity to two users", async () => {
    await repository.save(
      makeAccount({
        id: "oa-1",
        userId: "user-1",
        providerAccountId: "shared-subject",
      }),
    );

    await expect(
      repository.save(
        makeAccount({
          id: "oa-2",
          userId: "user-2",
          providerAccountId: "shared-subject",
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("removes a linked account", async () => {
    await repository.save(makeAccount({ id: "oa-1" }));
    await repository.delete("oa-1");

    expect(await repository.countByUserId("user-1")).toBe(0);
  });
});
