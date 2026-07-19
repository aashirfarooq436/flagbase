import type { User } from "../../../../domain/user/user.entity";
import type { IUserRepository } from "../../../../domain/user/user.repository";
import { NotFoundError, UnauthenticatedError } from "../../../../shared/errors";
import { Password } from "../../../../shared/password.vo";
import type { IPasswordHasher } from "../../../ports";
import type { IUseCase } from "../../use-case";

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

/**
 * Changes a user's own password after re-verifying the current one.
 *
 * Verifying the current password is a credential check, so a mismatch is an
 * UnauthenticatedError (401), the same category as a failed sign-in — not a validation
 * error. The delivery layer should surface it on the change-password form rather than
 * treating it as a session expiry.
 */
export class ChangePasswordUseCase implements IUseCase<
  ChangePasswordInput,
  User
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (user === null) {
      throw new NotFoundError(`User ${input.userId} not found`);
    }

    const currentMatches = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthenticatedError("Current password is incorrect");
    }

    // Validates the new password against policy before hashing.
    const newPassword = new Password(input.newPassword);
    user.setPassword(await this.passwordHasher.hash(newPassword.value));

    await this.userRepository.save(user);
    return user;
  }
}
