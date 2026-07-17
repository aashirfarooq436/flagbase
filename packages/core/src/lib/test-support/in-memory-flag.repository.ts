import type { Flag } from "../../domain/flag/flag.entity";
import type { FlagKey } from "../../domain/flag/flag-key.vo";
import type { IFlagRepository } from "../../domain/flag/flag.repository";

/**
 * An in-memory IFlagRepository for testing use-cases with zero infrastructure.
 *
 * Stores entities by reference, so a use-case that mutates then saves a flag is
 * reflected here — matching how the real Mongo repository round-trips. It does NOT
 * enforce the unique (projectId, key) index; that's the database's job and is tested
 * at the infrastructure layer. Use-cases check uniqueness themselves before saving.
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
