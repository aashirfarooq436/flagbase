import type { Email } from "../../shared/email.vo";
import type { User } from "./user.entity";

/**
 * Narrow by design (ISP): declares only what user use-cases actually call. No generic
 * CRUD base — an implementer shouldn't have to satisfy methods nobody invokes.
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  /** The account-linking lookup — see docs/DOMAIN_MODEL.md §4.3. */
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}
