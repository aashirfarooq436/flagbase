import {
  ConflictError,
  type IOAuthAccountRepository,
  type OAuthAccount,
  type OAuthProvider,
} from "@flagbase/core";

import { isDuplicateKeyError } from "../../shared/mongo-errors";
import { OAuthAccountMapper } from "./oauth-account.mapper";
import { OAuthAccountModel } from "./oauth-account.model";

export class MongoOAuthAccountRepository implements IOAuthAccountRepository {
  async findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    const document = await OAuthAccountModel.findOne({
      provider,
      providerAccountId,
    }).lean();
    return document ? OAuthAccountMapper.toDomain(document) : null;
  }

  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    const documents = await OAuthAccountModel.find({ userId }).lean();
    return documents.map(OAuthAccountMapper.toDomain);
  }

  async countByUserId(userId: string): Promise<number> {
    return OAuthAccountModel.countDocuments({ userId });
  }

  async save(account: OAuthAccount): Promise<void> {
    const document = OAuthAccountMapper.toDocument(account);

    try {
      await OAuthAccountModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          "This external account is already linked to a user",
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await OAuthAccountModel.deleteOne({ _id: id });
  }
}
