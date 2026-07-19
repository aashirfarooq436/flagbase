import type { User } from "../../../../domain/user/user.entity";
import type { IUserRepository } from "../../../../domain/user/user.repository";
import { NotFoundError } from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type UpdateProfileInput = {
  userId: string;
  name: string;
};

/** Updates a user's own display name. Email is immutable in v1, so it isn't touched. */
export class UpdateProfileUseCase implements IUseCase<
  UpdateProfileInput,
  User
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (user === null) {
      throw new NotFoundError(`User ${input.userId} not found`);
    }

    user.changeName(input.name);
    await this.userRepository.save(user);
    return user;
  }
}
