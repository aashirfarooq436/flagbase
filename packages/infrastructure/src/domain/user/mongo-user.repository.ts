import {
  ConflictError,
  type Email,
  type IUserRepository,
  type User,
} from "@flagbase/core";

import { isDuplicateKeyError } from "../../shared/mongo-errors";
import { UserMapper } from "./user.mapper";
import { UserModel } from "./user.model";

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const document = await UserModel.findById(id).lean();
    return document ? UserMapper.toDomain(document) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const document = await UserModel.findOne({ email: email.value }).lean();
    return document ? UserMapper.toDomain(document) : null;
  }

  async save(user: User): Promise<void> {
    const document = UserMapper.toDocument(user);

    try {
      await UserModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          `An account with email "${user.email.value}" already exists`,
        );
      }
      throw error;
    }
  }
}
