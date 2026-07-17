import {
  ConflictError,
  type IMemberRepository,
  type Member,
  Role,
} from "@flagbase/core";

import { isDuplicateKeyError } from "../../lib/mongoose/mongo-errors";
import { MemberMapper } from "./member.mapper";
import { MemberModel } from "./member.model";

export class MongoMemberRepository implements IMemberRepository {
  async findById(id: string): Promise<Member | null> {
    const document = await MemberModel.findById(id).lean();
    return document ? MemberMapper.toDomain(document) : null;
  }

  async findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<Member | null> {
    const document = await MemberModel.findOne({
      organizationId,
      userId,
    }).lean();
    return document ? MemberMapper.toDomain(document) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    const documents = await MemberModel.find({ organizationId }).lean();
    return documents.map(MemberMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const documents = await MemberModel.find({ userId }).lean();
    return documents.map(MemberMapper.toDomain);
  }

  async countOwners(organizationId: string): Promise<number> {
    return MemberModel.countDocuments({ organizationId, role: Role.Owner });
  }

  async save(member: Member): Promise<void> {
    const document = MemberMapper.toDocument(member);

    try {
      await MemberModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
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
    await MemberModel.deleteOne({ _id: id });
  }
}
