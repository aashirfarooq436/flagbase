/**
 * Organization (persisted shape)
 *   id         string
 *   name       string
 *   createdAt  Date
 *
 * No ownerId — the owner is the Member whose role is Owner (see below).
 */

import { Entity } from "../../shared/entity";
import { ValidationError } from "../../shared/errors";

const MAX_NAME_LENGTH = 100;

export type OrganizationProps = {
  id: string;
  name: string;
  createdAt: Date;
};

/**
 * A tenant — the account a customer's team works under.
 *
 * There is deliberately no `ownerId`. The owner is the Member whose role is Owner;
 * storing it here as well would create two sources of truth that can silently
 * disagree, and transferring ownership would mean remembering to update both.
 * Ownership is a role-bearing relationship, and relationships are entities.
 *
 * The consequence: "an organization has exactly one owner" cannot be enforced here —
 * an Organization can't see its members. It lives in the use-cases that create
 * organizations and change roles (docs/DOMAIN_MODEL.md §10).
 */
export class Organization extends Entity {
  readonly createdAt: Date;

  private _name: string;

  constructor(props: OrganizationProps) {
    super(props.id);

    Organization.assertValidName(props.name);

    this._name = props.name;
    this.createdAt = props.createdAt;
  }

  static create(input: { id: string; name: string; now: Date }): Organization {
    return new Organization({
      id: input.id,
      name: input.name,
      createdAt: input.now,
    });
  }

  get name(): string {
    return this._name;
  }

  rename(name: string): void {
    Organization.assertValidName(name);
    this._name = name;
  }

  private static assertValidName(name: string): void {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      throw new ValidationError("Organization name must not be empty");
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Organization name must be at most ${MAX_NAME_LENGTH} characters, received ${trimmed.length}`,
      );
    }
  }
}
