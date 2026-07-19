import { Email, User } from "@flagbase/core";

import type { UserDocument } from "./mongo-user.model";

export class UserMapper {
  static toDomain(document: UserDocument): User {
    return new User({
      id: document._id,
      email: new Email(document.email),
      name: document.name,
      passwordHash: document.passwordHash,
      createdAt: document.createdAt,
    });
  }

  static toDocument(user: User): UserDocument {
    return {
      _id: user.id,
      email: user.email.value,
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    };
  }
}
