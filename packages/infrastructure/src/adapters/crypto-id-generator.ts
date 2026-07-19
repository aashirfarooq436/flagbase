import { randomUUID } from "node:crypto";

import type { IIdGenerator } from "@flagbase/core";

/** IIdGenerator backed by crypto.randomUUID — the domain UUID stored as each document's _id. */
export class CryptoIdGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
