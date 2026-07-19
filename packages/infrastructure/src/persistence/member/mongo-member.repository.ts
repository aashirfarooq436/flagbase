import {
  ConflictError,
  type IMemberRepository,
  type Member,
  Role,
} from "@flagbase/core";

import type { ClientSession } from "mongoose";

import { isDuplicateKeyError } from "../../lib/mongoose/mongo-errors";
import { MemberMapper } from "./mongo-member.mapper";
import { MemberModel } from "./mongo-member.model";

export class MongoMemberRepository implements IMemberRepository {
  constructor(private readonly session?: ClientSession) {}

  async findById(id: string): Promise<Member | null> {
    const document = await MemberModel.findById(id, null, {
      session: this.session,
    }).lean();
    return document ? MemberMapper.toDomain(document) : null;
  }

  async findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<Member | null> {
    const document = await MemberModel.findOne(
      { organizationId, userId },
      null,
      { session: this.session },
    ).lean();
    return document ? MemberMapper.toDomain(document) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    const documents = await MemberModel.find({ organizationId }, null, {
      session: this.session,
    }).lean();
    return documents.map(MemberMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const documents = await MemberModel.find({ userId }, null, {
      session: this.session,
    }).lean();
    return documents.map(MemberMapper.toDomain);
  }

  async countOwners(organizationId: string): Promise<number> {
    return MemberModel.countDocuments(
      { organizationId, role: Role.Owner },
      { session: this.session },
    );
  }

  async save(member: Member): Promise<void> {
    const document = MemberMapper.toDocument(member);

    try {
      await MemberModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
        session: this.session,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          "This user is already a member of the organization",
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await MemberModel.deleteOne({ _id: id }, { session: this.session });
  }
}
