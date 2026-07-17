import { type IProjectRepository, type Project } from "@flagbase/core";
import type { ClientSession } from "mongoose";

import { ProjectMapper } from "./mongo-project.mapper";
import { ProjectModel } from "./mongo-project.model";

export class MongoProjectRepository implements IProjectRepository {
  constructor(private readonly session?: ClientSession) {}

  async findById(id: string): Promise<Project | null> {
    const document = await ProjectModel.findById(id, null, {
      session: this.session,
    }).lean();
    return document ? ProjectMapper.toDomain(document) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Project[]> {
    const documents = await ProjectModel.find({ organizationId }, null, {
      session: this.session,
    }).lean();
    return documents.map(ProjectMapper.toDomain);
  }

  async save(project: Project): Promise<void> {
    const document = ProjectMapper.toDocument(project);
    await ProjectModel.replaceOne({ _id: document._id }, document, {
      upsert: true,
      session: this.session,
    });
  }

  async delete(id: string): Promise<void> {
    await ProjectModel.deleteOne({ _id: id }, { session: this.session });
  }
}
