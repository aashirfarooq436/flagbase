import type { Email } from "../../shared/email.vo";
import type { User } from "./user.entity";

/**
 * Narrow by design (ISP): declares only what user use-cases actually call. No generic
 * CRUD base — an implementer shouldn't have to satisfy methods nobody invokes.
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  /**
   * Lookup by the login identifier. Email is the unique account key: sign-up uses this
   * to reject a duplicate registration, sign-in uses it to find the account to verify.
   */
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}
