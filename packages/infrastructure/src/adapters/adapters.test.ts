import { Email } from "@flagbase/core";
import type { Logger } from "@flagbase/shared/logger";

import { describe, expect, it } from "vitest";

import { Argon2PasswordHasher } from "./argon2-password-hasher";
import { ConsoleEmailSender } from "./console-email-sender";
import { CryptoIdGenerator } from "./crypto-id-generator";
import { CryptoTokenGenerator } from "./crypto-token-generator";
import { Sha256TokenHasher } from "./sha256-token-hasher";
import { SystemClock } from "./system-clock";

describe("CryptoIdGenerator", () => {
  it("generates non-empty, unique ids", () => {
    const gen = new CryptoIdGenerator();
    const ids = new Set(Array.from({ length: 1000 }, () => gen.generate()));
    expect(ids.size).toBe(1000);
    expect([...ids].every((id) => id.length > 0)).toBe(true);
  });
});

describe("SystemClock", () => {
  it("returns the current time", () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
  });
});

describe("CryptoTokenGenerator", () => {
  it("generates unique, URL-safe tokens", () => {
    const gen = new CryptoTokenGenerator();
    const tokens = Array.from({ length: 1000 }, () => gen.generate());
    expect(new Set(tokens).size).toBe(1000);
    // base64url alphabet only — safe in a URL without encoding.
    expect(tokens.every((t) => /^[A-Za-z0-9_-]+$/.test(t))).toBe(true);
  });
});

describe("Sha256TokenHasher", () => {
  const hasher = new Sha256TokenHasher();

  it("hashes deterministically", () => {
    expect(hasher.hash("a-token")).toBe(hasher.hash("a-token"));
  });

  it("does not store the token in the clear", () => {
    expect(hasher.hash("a-token")).not.toContain("a-token");
  });

  it("verifies a matching token and rejects a wrong one", () => {
    const hash = hasher.hash("a-token");
    expect(hasher.verify("a-token", hash)).toBe(true);
    expect(hasher.verify("wrong-token", hash)).toBe(false);
  });
});

describe("Argon2PasswordHasher", () => {
  const hasher = new Argon2PasswordHasher();

  it("hashes to something other than the plaintext", async () => {
    const hash = await hasher.hash("s3cur3-pass");
    expect(hash).not.toBe("s3cur3-pass");
    expect(hash.startsWith("$argon2")).toBe(true);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hasher.hash("s3cur3-pass");
    expect(await hasher.verify("s3cur3-pass", hash)).toBe(true);
    expect(await hasher.verify("wrong-pass", hash)).toBe(false);
  });

  it("returns false for a malformed hash instead of throwing", async () => {
    expect(await hasher.verify("s3cur3-pass", "not-a-hash")).toBe(false);
  });
});

describe("ConsoleEmailSender", () => {
  it("logs the invitation with its token and organization name", async () => {
    const lines: string[] = [];
    const capturing: Logger = {
      debug() {},
      info: (message) => lines.push(message),
      warn() {},
      error() {},
      child: () => capturing,
    };
    const sender = new ConsoleEmailSender(capturing);

    await sender.sendInvitation(
      new Email("invitee@example.com"),
      "raw-token",
      "Acme",
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("invitee@example.com");
    expect(lines[0]).toContain("raw-token");
    expect(lines[0]).toContain("Acme");
  });
});
