import {
  type IOrganizationRepository,
  type Organization,
} from "@flagbase/core";

import { OrganizationMapper } from "./organization.mapper";
import { OrganizationModel } from "./organization.model";

export class MongoOrganizationRepository implements IOrganizationRepository {
  async findById(id: string): Promise<Organization | null> {
    const document = await OrganizationModel.findById(id).lean();
    return document ? OrganizationMapper.toDomain(document) : null;
  }

  async save(organization: Organization): Promise<void> {
    const document = OrganizationMapper.toDocument(organization);
    await OrganizationModel.replaceOne({ _id: document._id }, document, {
      upsert: true,
    });
  }
}
