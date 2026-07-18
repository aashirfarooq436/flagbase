/**
 * Member (persisted shape)
 *   id              string
 *   organizationId  string
 *   userId          string
 *   role            Role
 *   createdAt       Date
 */

import { Entity } from "../../shared/entity";
import type { Permission } from "./role";
import { Role, roleHasPermission } from "./role";

export type MemberProps = {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  createdAt: Date;
};

/**
 * A user's membership of an organization, carrying their role.
 *
 * The join between User and Organization, modelled as an entity rather than an array
 * on either side. That's what makes "owns one organization, is a low-privilege member
 * of another" fall out naturally instead of needing a special case — and it's why
 * Organization has no ownerId.
 */
export class Member extends Entity {
  readonly organizationId: string;
  readonly userId: string;
  readonly createdAt: Date;

  private _role: Role;

  constructor(props: MemberProps) {
    super(props.id);

    this.organizationId = props.organizationId;
    this.userId = props.userId;
    this._role = props.role;
    this.createdAt = props.createdAt;
  }

  static create(input: {
    id: string;
    organizationId: string;
    userId: string;
    role: Role;
    now: Date;
  }): Member {
    return new Member({
      id: input.id,
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      createdAt: input.now,
    });
  }

  get role(): Role {
    return this._role;
  }

  get isOwner(): boolean {
    return this._role === Role.Owner;
  }

  hasPermission(permission: Permission): boolean {
    return roleHasPermission(this._role, permission);
  }

  /**
   * Change this member's role.
   *
   * Note what is *not* checked here: whether this would leave the organization without
   * an owner, or hand it a second one. A Member can't see its siblings, so that rule
   * belongs to the use-case, which can count owners first (IMemberRepository.countOwners).
   */
  changeRole(role: Role): void {
    this._role = role;
  }
}
