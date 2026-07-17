import { OAuthAccount } from "@flagbase/core";

import type { OAuthAccountDocument } from "./oauth-account.model";

export class OAuthAccountMapper {
  static toDomain(document: OAuthAccountDocument): OAuthAccount {
    return new OAuthAccount({
      id: document._id,
      userId: document.userId,
      provider: document.provider,
      providerAccountId: document.providerAccountId,
      createdAt: document.createdAt,
    });
  }

  static toDocument(account: OAuthAccount): OAuthAccountDocument {
    return {
      _id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      createdAt: account.createdAt,
    };
  }
}
