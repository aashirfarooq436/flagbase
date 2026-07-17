/**
 * OAuthAccount (persisted shape)
 *   id                 string
 *   userId             string
 *   provider           OAuthProvider
 *   providerAccountId  string        — provider's stable subject id, not the email
 *   createdAt          Date
 */

import { Entity } from "../../shared/entity";
import { ValidationError } from "../../shared/errors";
import type { OAuthProvider } from "./oauth-provider.vo";

export type OAuthAccountProps = {
  id: string;
  userId: string;
  provider: OAuthProvider;
  /**
   * The provider's stable subject identifier — Google's `sub` claim, not the email.
   *
   * Matching on the provider's email would be a bug: a user can change their Google
   * address, and we'd then fail to recognise a returning account. The subject id
   * never changes.
   */
  providerAccountId: string;
  createdAt: Date;
};

/**
 * A link between one of our Users and an identity at an external provider.
 *
 * One User has many of these — that's what "one account, several ways to sign in"
 * means. Immutable once created: re-linking is a delete plus an insert, not an edit.
 */
export class OAuthAccount extends Entity {
  readonly userId: string;
  readonly provider: OAuthProvider;
  readonly providerAccountId: string;
  readonly createdAt: Date;

  constructor(props: OAuthAccountProps) {
    super(props.id);

    if (props.providerAccountId.length === 0) {
      throw new ValidationError("OAuth providerAccountId must not be empty");
    }

    this.userId = props.userId;
    this.provider = props.provider;
    this.providerAccountId = props.providerAccountId;
    this.createdAt = props.createdAt;
  }

  static create(input: {
    id: string;
    userId: string;
    provider: OAuthProvider;
    providerAccountId: string;
    now: Date;
  }): OAuthAccount {
    return new OAuthAccount({
      id: input.id,
      userId: input.userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      createdAt: input.now,
    });
  }
}
