import type { User } from "../../../../domain/user/user.entity";
import type { IUserRepository } from "../../../../domain/user/user.repository";
import type { IUseCase } from "../../use-case";

export type GetCurrentUserInput = {
  userId: string;
};

/**
 * Resolves the authenticated user from their session identity.
 *
 * Returns null rather than throwing NotFound: absence is a normal branch here. A session
 * whose user has since been deleted is an authentication failure the delivery layer maps to
 * 401 (clear the cookie), not a 404 rendered to someone. Unlike GetOrganization — a
 * user-facing fetch where a missing row genuinely is a 404 — this is a session lookup.
 */
export class GetCurrentUserUseCase implements IUseCase<
  GetCurrentUserInput,
  User | null
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<User | null> {
    return this.userRepository.findById(input.userId);
  }
}
