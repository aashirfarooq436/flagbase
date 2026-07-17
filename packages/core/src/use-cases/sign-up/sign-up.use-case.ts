import { User } from "../../domain/user/user.entity";
import type { IUserRepository } from "../../domain/user/user.repository";
import { Email } from "../../shared/email.vo";
import { ConflictError } from "../../shared/errors";
import { Password } from "../../shared/password.vo";
import type { IClock, IIdGenerator, IPasswordHasher } from "../../shared/ports";
import type { IUseCase } from "../use-case";

export type SignUpInput = {
  email: string;
  name: string;
  password: string;
};

/**
 * Registers a new user with email + password.
 *
 * Creates only a User — no organization. "Signed up, no organization yet" is a real
 * state; the user creates or joins an organization as a separate step.
 *
 * The password is hashed here via IPasswordHasher (argon2 in production); `core` never
 * sees or stores plaintext. The pre-check for a taken email is a friendly-error
 * convenience; the DB unique index is the actual race-safe guarantee (and also throws
 * ConflictError), so this stays correct under concurrency.
 */
export class SignUpUseCase implements IUseCase<SignUpInput, User> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(input: SignUpInput): Promise<User> {
    const email = new Email(input.email);
    const password = new Password(input.password);

    const existing = await this.userRepository.findByEmail(email);
    if (existing !== null) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await this.passwordHasher.hash(password.value);

    const user = User.create({
      id: this.idGenerator.generate(),
      email,
      name: input.name,
      passwordHash,
      now: this.clock.now(),
    });

    await this.userRepository.save(user);
    return user;
  }
}
