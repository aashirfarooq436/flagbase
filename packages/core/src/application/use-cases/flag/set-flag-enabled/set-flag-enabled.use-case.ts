import type { Flag } from "../../../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import type { IClock } from "../../../ports";
import { loadFlagInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type SetFlagEnabledInput = {
  organizationId: string;
  flagId: string;
  /** Explicit target state — idempotent, unlike a blind toggle. */
  enabled: boolean;
};

/**
 * Enables or disables a flag. `enabled: false` is the kill switch — `Flag.evaluate`
 * short-circuits to false for everyone regardless of rules (docs/DOMAIN_MODEL.md §8.3).
 */
export class SetFlagEnabledUseCase implements IUseCase<
  SetFlagEnabledInput,
  Flag
> {
  constructor(
    private readonly flagRepository: IFlagRepository,
    private readonly projectRepository: IProjectRepository,
    private readonly clock: IClock,
  ) {}

  async execute(input: SetFlagEnabledInput): Promise<Flag> {
    const flag = await loadFlagInOrganization(
      input.flagId,
      input.organizationId,
      this.flagRepository,
      this.projectRepository,
    );

    const now = this.clock.now();
    if (input.enabled) {
      flag.enable(now);
    } else {
      flag.disable(now);
    }

    await this.flagRepository.save(flag);
    return flag;
  }
}
