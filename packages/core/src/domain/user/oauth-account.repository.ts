import type { OAuthAccount } from "./oauth-account.entity";
import type { OAuthProvider } from "./oauth-provider.vo";

export interface IOAuthAccountRepository {
  /** The returning-user lookup: match on the provider's stable subject id, never its email. */
  findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccount | null>;
  findByUserId(userId: string): Promise<OAuthAccount[]>;
  /**
   * How many sign-in methods a user has via OAuth. Lets the unlink use-case refuse to
   * remove the last way in (docs/DOMAIN_MODEL.md §10) without loading every account.
   */
  countByUserId(userId: string): Promise<number>;
  save(account: OAuthAccount): Promise<void>;
  delete(id: string): Promise<void>;
}
