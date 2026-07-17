import { randomBytes } from "node:crypto";

import type { ITokenGenerator } from "@flagbase/core";

/** 32 bytes of entropy — unguessable, and short enough for an invitation URL. */
const TOKEN_BYTES = 32;

/** ITokenGenerator backed by crypto.randomBytes, base64url-encoded for URL safety. */
export class CryptoTokenGenerator implements ITokenGenerator {
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString("base64url");
  }
}
