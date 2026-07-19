import type { User } from "../../../../domain/user/user.entity";
import type { IUserRepository } from "../../../../domain/user/user.repository";
import { Email } from "../../../../shared/email.vo";
import { NotFoundError, UnauthenticatedError } from "../../../../shared/errors";
import type { IPasswordHasher } from "../../../ports";
import type { IUseCase } from "../../use-case";

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
 * Error semantics (product decision, Aashir 2026-07-19): a missing account throws
 * `NotFoundError` (→ 404) and a wrong password throws `UnauthenticatedError` (→ 401), so the
 * two failures are distinguishable. TRADEOFF: this distinction lets a caller enumerate which
 * emails have accounts (probe for 404 vs 401). The earlier design returned an identical 401
 * for both precisely to prevent that; revert to it if account enumeration becomes a concern.
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
      throw new NotFoundError("No account found for this email");
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
