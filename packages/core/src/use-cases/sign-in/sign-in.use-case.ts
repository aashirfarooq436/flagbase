import type { User } from "../../domain/user/user.entity";
import type { IUserRepository } from "../../domain/user/user.repository";
import { Email } from "../../shared/email.vo";
import { UnauthenticatedError } from "../../shared/errors";
import type { IPasswordHasher } from "../../shared/ports";
import type { IUseCase } from "../use-case";

export type SignInInput = {
  email: string;
  password: string;
};

/**
 * Verifies email + password and returns the authenticated user.
 *
 * Session creation is NOT here — it's a delivery-layer concern. This use-case answers
 * one question: "are these credentials valid?", and returns the User if so.
 *
 * A single generic message is used for both "no such email" and "wrong password" so the
 * error can't be used to enumerate which emails have accounts.
 *
 * Known limitation: a missing user returns before any hash verification runs, so the two
 * paths differ in timing — a determined attacker could still enumerate accounts by
 * response time. Hardening (verifying against a dummy hash on the miss path) is deferred;
 * message parity is the v1 defense.
 */
export class SignInUseCase implements IUseCase<SignInInput, User> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: SignInInput): Promise<User> {
    const email = new Email(input.email);

    const user = await this.userRepository.findByEmail(email);
    if (user === null) {
      throw new UnauthenticatedError("Invalid email or password");
    }

    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthenticatedError("Invalid email or password");
    }

    return user;
  }
}
