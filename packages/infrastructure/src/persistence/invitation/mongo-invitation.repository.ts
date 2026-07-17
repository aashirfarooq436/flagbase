import {
  ConflictError,
  type Email,
  type IInvitationRepository,
  type Invitation,
  InvitationStatus,
} from "@flagbase/core";
import type { ClientSession } from "mongoose";

import { isDuplicateKeyError } from "../../lib/mongoose/mongo-errors";
import { InvitationMapper } from "./mongo-invitation.mapper";
import { InvitationModel } from "./mongo-invitation.model";

export class MongoInvitationRepository implements IInvitationRepository {
  constructor(private readonly session?: ClientSession) {}

  async findById(id: string): Promise<Invitation | null> {
    const document = await InvitationModel.findById(id, null, {
      session: this.session,
    }).lean();
    return document ? InvitationMapper.toDomain(document) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const document = await InvitationModel.findOne({ tokenHash }, null, {
      session: this.session,
    }).lean();
    return document ? InvitationMapper.toDomain(document) : null;
  }

  async findPendingByOrganizationAndEmail(
    organizationId: string,
    email: Email,
  ): Promise<Invitation | null> {
    const document = await InvitationModel.findOne(
      {
        organizationId,
        email: email.value,
        status: InvitationStatus.Pending,
      },
      null,
      { session: this.session },
    ).lean();
    return document ? InvitationMapper.toDomain(document) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Invitation[]> {
    const documents = await InvitationModel.find({ organizationId }, null, {
      session: this.session,
    }).lean();
    return documents.map(InvitationMapper.toDomain);
  }

  async save(invitation: Invitation): Promise<void> {
    const document = InvitationMapper.toDocument(invitation);

    try {
      await InvitationModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
        session: this.session,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("This invitation token already exists");
      }
      throw error;
    }
  }
}
