import { Project } from "@flagbase/core";

import type { ProjectDocument } from "./mongo-project.model";

export class ProjectMapper {
  static toDomain(document: ProjectDocument): Project {
    return new Project({
      id: document._id,
      organizationId: document.organizationId,
      name: document.name,
      createdAt: document.createdAt,
    });
  }

  static toDocument(project: Project): ProjectDocument {
    return {
      _id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      createdAt: project.createdAt,
    };
  }
}
