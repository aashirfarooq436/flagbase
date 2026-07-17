import { ConflictError, Email, User } from "@flagbase/core";
import { describe, expect, it } from "vitest";

import { useMongoTestEnv } from "../../test-support/mongo-test-env";
import { MongoUserRepository } from "./mongo-user.repository";
import { UserModel } from "./user.model";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const repository = new MongoUserRepository();

function makePasswordUser(id: string, email: string): User {
  return User.create({
    id,
    email: new Email(email),
    name: "Aashir",
    passwordHash: "hashed-secret",
    emailVerifiedAt: null,
    now: NOW,
  });
}

useMongoTestEnv(async () => {
  await UserModel.init();
});

describe("MongoUserRepository", () => {
  it("persists and reloads a password user with all fields", async () => {
    await repository.save(makePasswordUser("user-1", "aashir@example.com"));

    const loaded = await repository.findById("user-1");
    expect(loaded!.email.value).toBe("aashir@example.com");
    expect(loaded!.name).toBe("Aashir");
    expect(loaded!.hasPassword).toBe(true);
    expect(loaded!.isEmailVerified).toBe(false);
  });

  it("round-trips an OAuth-only user with null password and a verified email", async () => {
    const user = User.create({
      id: "user-2",
      email: new Email("oauth@example.com"),
      name: "OAuth User",
      passwordHash: null,
      emailVerifiedAt: NOW,
      now: NOW,
    });
    await repository.save(user);

    const loaded = await repository.findById("user-2");
    expect(loaded!.hasPassword).toBe(false);
    expect(loaded!.isEmailVerified).toBe(true);
    expect(loaded!.emailVerifiedAt!.getTime()).toBe(NOW.getTime());
  });

  it("finds by normalized email regardless of input casing", async () => {
    await repository.save(makePasswordUser("user-1", "aashir@example.com"));

    // The Email VO normalizes, so a differently-cased lookup still matches.
    const found = await repository.findByEmail(new Email("Aashir@Example.com"));
    expect(found!.id).toBe("user-1");
  });

  it("rejects a second account with the same email", async () => {
    await repository.save(makePasswordUser("user-1", "dupe@example.com"));

    await expect(
      repository.save(makePasswordUser("user-2", "dupe@example.com")),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("persists verification state changes on update", async () => {
    const user = makePasswordUser("user-1", "aashir@example.com");
    await repository.save(user);

    user.verifyEmail(NOW);
    await repository.save(user);

    expect((await repository.findById("user-1"))!.isEmailVerified).toBe(true);
  });
});
