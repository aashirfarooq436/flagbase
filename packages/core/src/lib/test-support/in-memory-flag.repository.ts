import type { Flag } from "../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../domain/flag/flag.repository";
import type { FlagKey } from "../../domain/flag/flag-key.vo";

/**
 * An in-memory IFlagRepository for testing use-cases with zero infrastructure.
 *
 * Stores entities by reference — unlike the Mongo repository, which rebuilds a fresh
 * entity from a document on every read. The normal use-case path (load → mutate → save)
 * behaves identically on both; the difference only shows if code mutates without saving
 * or relies on read identity, which no use-case does. It also does NOT enforce the unique
 * (projectId, key) index; that's the database's job and is tested at the infrastructure
 * layer. Use-cases check uniqueness themselves before saving.
 */
export class InMemoryFlagRepository implements IFlagRepository {
  private readonly store = new Map<string, Flag>();

  constructor(seed: Flag[] = []) {
    for (const flag of seed) {
      this.store.set(flag.id, flag);
    }
  }

  async findById(id: string): Promise<Flag | null> {
    return this.store.get(id) ?? null;
  }

  async findByProjectAndKey(
    projectId: string,
    key: FlagKey,
  ): Promise<Flag | null> {
    for (const flag of this.store.values()) {
      if (flag.projectId === projectId && flag.key.equals(key)) {
        return flag;
      }
    }
    return null;
  }

  async findByProjectId(projectId: string): Promise<Flag[]> {
    return [...this.store.values()].filter(
      (flag) => flag.projectId === projectId,
    );
  }

  async save(flag: Flag): Promise<void> {
    this.store.set(flag.id, flag);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
