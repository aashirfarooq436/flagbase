import type { Project } from "./project.entity";

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByOrganizationId(organizationId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
