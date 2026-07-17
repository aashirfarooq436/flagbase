import type { Email } from "../../shared/email.vo";
import type { User } from "../../domain/user/user.entity";
import type { IUserRepository } from "../../domain/user/user.repository";

/** An in-memory IUserRepository for testing use-cases with zero infrastructure. */
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>();

  constructor(seed: User[] = []) {
    for (const user of seed) {
      this.store.set(user.id, user);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }
}
