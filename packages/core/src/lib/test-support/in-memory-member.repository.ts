import type { Member } from "../../domain/member/member.entity";
import type { IMemberRepository } from "../../domain/member/member.repository";
import { Role } from "../../domain/member/role.vo";

/** An in-memory IMemberRepository for testing use-cases with zero infrastructure. */
export class InMemoryMemberRepository implements IMemberRepository {
  private readonly store = new Map<string, Member>();

  constructor(seed: Member[] = []) {
    for (const member of seed) {
      this.store.set(member.id, member);
    }
  }

  async findById(id: string): Promise<Member | null> {
    return this.store.get(id) ?? null;
  }

  async findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<Member | null> {
    for (const member of this.store.values()) {
      if (
        member.organizationId === organizationId &&
        member.userId === userId
      ) {
        return member;
      }
    }
    return null;
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    return [...this.store.values()].filter(
      (member) => member.organizationId === organizationId,
    );
  }

  async countOwners(organizationId: string): Promise<number> {
    return [...this.store.values()].filter(
      (member) =>
        member.organizationId === organizationId && member.role === Role.Owner,
    ).length;
  }

  async save(member: Member): Promise<void> {
    this.store.set(member.id, member);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
