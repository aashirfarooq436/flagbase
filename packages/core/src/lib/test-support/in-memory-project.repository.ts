import type { Project } from "../../domain/project/project.entity";
import type { IProjectRepository } from "../../domain/project/project.repository";

/** An in-memory IProjectRepository for testing use-cases with zero infrastructure. */
export class InMemoryProjectRepository implements IProjectRepository {
  private readonly store = new Map<string, Project>();

  constructor(seed: Project[] = []) {
    for (const project of seed) {
      this.store.set(project.id, project);
    }
  }

  async findById(id: string): Promise<Project | null> {
    return this.store.get(id) ?? null;
  }

  async findByOrganizationId(organizationId: string): Promise<Project[]> {
    return [...this.store.values()].filter(
      (project) => project.organizationId === organizationId,
    );
  }

  async save(project: Project): Promise<void> {
    this.store.set(project.id, project);
  }
}
