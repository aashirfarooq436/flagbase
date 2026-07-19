import { Member } from "@flagbase/core";

import type { MemberDocument } from "./mongo-member.model";

export class MemberMapper {
  static toDomain(document: MemberDocument): Member {
    return new Member({
      id: document._id,
      organizationId: document.organizationId,
      userId: document.userId,
      role: document.role,
      createdAt: document.createdAt,
    });
  }

  static toDocument(member: Member): MemberDocument {
    return {
      _id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
    };
  }
}
