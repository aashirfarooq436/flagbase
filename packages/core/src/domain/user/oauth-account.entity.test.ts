import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { OAuthAccount } from "./oauth-account.entity";
import { OAuthProvider } from "./oauth-provider.vo";

const NOW = new Date("2026-07-17T00:00:00.000Z");

describe("OAuthAccount", () => {
  it("creates a link to an external identity", () => {
    const account = OAuthAccount.create({
      id: "oauth-1",
      userId: "user-1",
      provider: OAuthProvider.Google,
      providerAccountId: "google-subject-123",
      now: NOW,
    });

    expect(account.userId).toBe("user-1");
    expect(account.provider).toBe(OAuthProvider.Google);
    expect(account.providerAccountId).toBe("google-subject-123");
    expect(account.createdAt).toBe(NOW);
  });

  it("rejects an empty providerAccountId — there would be nothing stable to match on", () => {
    expect(() =>
      OAuthAccount.create({
        id: "oauth-1",
        userId: "user-1",
        provider: OAuthProvider.Google,
        providerAccountId: "",
        now: NOW,
      }),
    ).toThrow(ValidationError);
  });
});
