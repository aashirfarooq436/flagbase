import {
  type IOrganizationRepository,
  type Organization,
} from "@flagbase/core";

import type { ClientSession } from "mongoose";

import { OrganizationMapper } from "./mongo-organization.mapper";
import { OrganizationModel } from "./mongo-organization.model";

export class MongoOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly session?: ClientSession) {}

  async findById(id: string): Promise<Organization | null> {
    const document = await OrganizationModel.findById(id, null, {
      session: this.session,
    }).lean();
    return document ? OrganizationMapper.toDomain(document) : null;
  }

  async save(organization: Organization): Promise<void> {
    const document = OrganizationMapper.toDocument(organization);
    await OrganizationModel.replaceOne({ _id: document._id }, document, {
      upsert: true,
      session: this.session,
    });
  }
}
