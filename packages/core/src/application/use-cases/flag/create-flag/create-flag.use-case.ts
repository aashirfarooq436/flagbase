import { FlagKey } from "../../../../domain/flag/flag-key.vo";
import { Flag } from "../../../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../../shared/errors";
import type { IClock, IIdGenerator } from "../../../ports";
import type { IUseCase } from "../../use-case";

export type CreateFlagInput = {
  /** The acting user's organization, set by the delivery layer after authentication. */
  organizationId: string;
  projectId: string;
  key: string;
  description: string;
  defaultValue?: boolean;
};

/**
 * Creates a flag under a project, shipped dark.
 *
 * This is the template every flag use-case follows: load the parent, verify it belongs
 * to the actor's organization (the tenant boundary the route's coarse RBAC can't check),
 * enforce domain rules, act, return the entity.
 */
export class CreateFlagUseCase implements IUseCase<CreateFlagInput, Flag> {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly flagRepository: IFlagRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(input: CreateFlagInput): Promise<Flag> {
    const project = await this.projectRepository.findById(input.projectId);
    if (project === null) {
      throw new NotFoundError(`Project ${input.projectId} not found`);
    }

    // Tenant boundary: CASL (delivery) checked the actor's ROLE; this checks that the
    // resource actually belongs to the actor's organization.
    if (project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Project does not belong to this organization");
    }

    // Domain validation happens by constructing the value object.
    const key = new FlagKey(input.key);

    // Check-first; the DB unique index is the backstop for a concurrent duplicate.
    const existing = await this.flagRepository.findByProjectAndKey(
      input.projectId,
      key,
    );
    if (existing !== null) {
      throw new ConflictError(
        `A flag with key "${key.value}" already exists in this project`,
      );
    }

    const flag = Flag.create({
      id: this.idGenerator.generate(),
      projectId: input.projectId,
      key,
      description: input.description,
      defaultValue: input.defaultValue,
      now: this.clock.now(),
    });

    await this.flagRepository.save(flag);
    return flag;
  }
}
