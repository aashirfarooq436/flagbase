import {
  ConflictError,
  type Email,
  type IInvitationRepository,
  type Invitation,
  InvitationStatus,
} from "@flagbase/core";

import { isDuplicateKeyError } from "../../shared/mongo-errors";
import { InvitationMapper } from "./invitation.mapper";
import { InvitationModel } from "./invitation.model";

export class MongoInvitationRepository implements IInvitationRepository {
  async findById(id: string): Promise<Invitation | null> {
    const document = await InvitationModel.findById(id).lean();
    return document ? InvitationMapper.toDomain(document) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const document = await InvitationModel.findOne({ tokenHash }).lean();
    return document ? InvitationMapper.toDomain(document) : null;
  }

  async findPendingByOrganizationAndEmail(
    organizationId: string,
    email: Email,
  ): Promise<Invitation | null> {
    const document = await InvitationModel.findOne({
      organizationId,
      email: email.value,
      status: InvitationStatus.Pending,
    }).lean();
    return document ? InvitationMapper.toDomain(document) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Invitation[]> {
    const documents = await InvitationModel.find({ organizationId }).lean();
    return documents.map(InvitationMapper.toDomain);
  }

  async save(invitation: Invitation): Promise<void> {
    const document = InvitationMapper.toDocument(invitation);

    try {
      await InvitationModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("This invitation token already exists");
      }
      throw error;
    }
  }
}
