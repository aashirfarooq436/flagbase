/**
 * Project (persisted shape)
 *   id              string
 *   organizationId  string
 *   name            string
 *   createdAt       Date
 *
 *   apiKeyHash      string  — [v2] added with the SDK; no runtime consumer in v1
 */

import { Entity } from "../../shared/entity";
import { ValidationError } from "../../shared/errors";

const MAX_NAME_LENGTH = 100;

export type ProjectProps = {
  id: string;
  organizationId: string;
  name: string;
  createdAt: Date;
};

/**
 * A customer's product or API — the container flags live under.
 *
 * In v2 this also becomes the unit an installed SDK authenticates against, via a
 * hashed API key. That field is deliberately absent in v1: nothing consumes flags at
 * runtime yet, so there's no key to authenticate, and a credential nobody uses is
 * just attack surface. It returns as one field plus a hash-on-creation, not a redesign
 * (docs/DOMAIN_MODEL.md §7.1).
 */
export class Project extends Entity {
  readonly organizationId: string;
  readonly createdAt: Date;

  private _name: string;

  constructor(props: ProjectProps) {
    super(props.id);

    Project.assertValidName(props.name);

    this.organizationId = props.organizationId;
    this._name = props.name;
    this.createdAt = props.createdAt;
  }

  static create(input: {
    id: string;
    organizationId: string;
    name: string;
    now: Date;
  }): Project {
    return new Project({
      id: input.id,
      organizationId: input.organizationId,
      name: input.name,
      createdAt: input.now,
    });
  }

  get name(): string {
    return this._name;
  }

  rename(name: string): void {
    Project.assertValidName(name);
    this._name = name;
  }

  private static assertValidName(name: string): void {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      throw new ValidationError("Project name must not be empty");
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Project name must be at most ${MAX_NAME_LENGTH} characters, received ${trimmed.length}`,
      );
    }
  }
}
