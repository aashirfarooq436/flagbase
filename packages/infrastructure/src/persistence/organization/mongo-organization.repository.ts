import {
  ConflictError,
  type IOrganizationRepository,
  type Organization,
  type Slug,
} from "@flagbase/core";

import type { ClientSession } from "mongoose";

import { isDuplicateKeyError } from "../../lib/mongoose/mongo-errors";
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

  async findBySlug(slug: Slug): Promise<Organization | null> {
    const document = await OrganizationModel.findOne(
      { slug: slug.value },
      null,
      { session: this.session },
    ).lean();
    return document ? OrganizationMapper.toDomain(document) : null;
  }

  async save(organization: Organization): Promise<void> {
    const document = OrganizationMapper.toDocument(organization);
    try {
      await OrganizationModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
        session: this.session,
      });
    } catch (error) {
      // The unique slug index is the race-safe backstop to the use-case's pre-check.
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          "An organization with this name already exists",
        );
      }
      throw error;
    }
  }
}
