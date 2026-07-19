import { Project } from "../../../../domain/project/project.entity";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import type { IClock, IIdGenerator } from "../../../ports";
import type { IUseCase } from "../../use-case";

export type CreateProjectInput = {
  /** The acting user's organization — the project is created under it. */
  organizationId: string;
  name: string;
};

/**
 * Creates a project under an organization.
 *
 * Single write. The organization comes from the authenticated actor's context (set by
 * the delivery layer), so there's no parent to load and check — the actor is already a
 * member of it. Name validation happens in `Project.create`.
 */
export class CreateProjectUseCase implements IUseCase<
  CreateProjectInput,
  Project
> {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const project = Project.create({
      id: this.idGenerator.generate(),
      organizationId: input.organizationId,
      name: input.name,
      now: this.clock.now(),
    });

    await this.projectRepository.save(project);
    return project;
  }
}
