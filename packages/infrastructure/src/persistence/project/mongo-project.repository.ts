import { type IProjectRepository, type Project } from "@flagbase/core";

import { ProjectMapper } from "./project.mapper";
import { ProjectModel } from "./project.model";

export class MongoProjectRepository implements IProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const document = await ProjectModel.findById(id).lean();
    return document ? ProjectMapper.toDomain(document) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Project[]> {
    const documents = await ProjectModel.find({ organizationId }).lean();
    return documents.map(ProjectMapper.toDomain);
  }

  async save(project: Project): Promise<void> {
    const document = ProjectMapper.toDocument(project);
    await ProjectModel.replaceOne({ _id: document._id }, document, {
      upsert: true,
    });
  }

  async delete(id: string): Promise<void> {
    await ProjectModel.deleteOne({ _id: id });
  }
}
