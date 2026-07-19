import { ConflictError, Email, User } from "@flagbase/core";

import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../lib/test-support/mongo-test-env";
import { UserModel } from "./mongo-user.model";
import { MongoUserRepository } from "./mongo-user.repository";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const repository = new MongoUserRepository();

function makeUser(id: string, email: string): User {
  return User.create({
    id,
    email: new Email(email),
    name: "Aashir",
    passwordHash: "hashed-secret",
    now: NOW,
  });
}

useMongoTestEnv(async () => {
  await UserModel.init();
});

describe("MongoUserRepository", () => {
  it("persists and reloads a user with all fields", async () => {
    await repository.save(makeUser("user-1", "aashir@example.com"));

    const loaded = await repository.findById("user-1");
    expect(loaded!.email.value).toBe("aashir@example.com");
    expect(loaded!.name).toBe("Aashir");
    expect(loaded!.passwordHash).toBe("hashed-secret");
  });

  it("finds by normalized email regardless of input casing", async () => {
    await repository.save(makeUser("user-1", "aashir@example.com"));

    // The Email VO normalizes, so a differently-cased lookup still matches.
    const found = await repository.findByEmail(new Email("Aashir@Example.com"));
    expect(found!.id).toBe("user-1");
  });

  it("returns null for an unknown email", async () => {
    expect(
      await repository.findByEmail(new Email("nobody@example.com")),
    ).toBeNull();
  });

  it("rejects a second account with the same email", async () => {
    await repository.save(makeUser("user-1", "dupe@example.com"));

    await expect(
      repository.save(makeUser("user-2", "dupe@example.com")),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("persists a password change on update", async () => {
    const user = makeUser("user-1", "aashir@example.com");
    await repository.save(user);

    user.setPassword("new-hash");
    await repository.save(user);

    expect((await repository.findById("user-1"))!.passwordHash).toBe(
      "new-hash",
    );
  });
});
