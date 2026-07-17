import type { Member } from "./member.entity";

export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<Member | null>;
  findByOrganizationId(organizationId: string): Promise<Member[]>;
  /**
   * How many owners an organization currently has. Backs the "exactly one owner"
   * invariant — change-role and remove-member consult it before demoting or removing
   * an owner (docs/DOMAIN_MODEL.md §10).
   */
  countOwners(organizationId: string): Promise<number>;
  save(member: Member): Promise<void>;
  delete(id: string): Promise<void>;
}
