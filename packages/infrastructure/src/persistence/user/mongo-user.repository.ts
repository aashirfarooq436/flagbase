import {
  ConflictError,
  type Email,
  type IUserRepository,
  type User,
} from "@flagbase/core";

import type { ClientSession } from "mongoose";

import { isDuplicateKeyError } from "../../lib/mongoose/mongo-errors";
import { UserMapper } from "./mongo-user.mapper";
import { UserModel } from "./mongo-user.model";

export class MongoUserRepository implements IUserRepository {
  constructor(private readonly session?: ClientSession) {}

  async findById(id: string): Promise<User | null> {
    const document = await UserModel.findById(id, null, {
      session: this.session,
    }).lean();
    return document ? UserMapper.toDomain(document) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const document = await UserModel.findOne({ email: email.value }, null, {
      session: this.session,
    }).lean();
    return document ? UserMapper.toDomain(document) : null;
  }

  async save(user: User): Promise<void> {
    const document = UserMapper.toDocument(user);

    try {
      await UserModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
        session: this.session,
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
