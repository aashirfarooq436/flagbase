# FlagBase — Domain Model

The entities, value objects, ports, and invariants of `packages/core`. This is the reference for
what exists in the domain and where each rule is enforced.

Architectural rules for `core` (purity, the import matrix, SOLID) live in
`BACKEND_ARCHITECTURE.md`. This document is about _what is modeled_, not how the layers relate.

**v1 scope.** Everything here is v1 except items marked **[v2]** — currently `PlatformAdmin` (§8)
and `Project.apiKeyHash` (§7.1), both of which exist only to serve deliverables deferred out of v1
(`SYSTEM_DESIGN.md` §0). `Flag.evaluate()` stays in v1 despite nothing consuming it at runtime: it
is the domain's central business rule and the whole reason the project exists.

---

## 1. Two principles this model follows

**Inject what varies by environment; keep pure what must never vary.**

IDs need real entropy and time needs a real clock — both are environmental, so both are ports
injected from outside (`IIdGenerator`, `IClock`). Rollout bucketing is the opposite: it must
produce byte-identical results in the dashboard, in a customer's Node server, and in a Cloudflare
Worker, forever. So it's pure math written directly in `core` (§7.4). If bucketing were injected,
two implementations could disagree and the same user would flicker in and out of a feature
depending on which process evaluated them.

**Invariants live at the narrowest scope that can enforce them.**

A rule that needs only the entity's own fields (`RolloutPercentage` is 0–100) goes in a
constructor. A rule that needs to see other rows ("an org has exactly one owner") cannot live on
an entity — it goes in a use-case, usually backed by a database constraint. §10 maps every
invariant to its home.

---

## 2. Identity and equality

Entities have identity: two `Flag` objects with the same `id` are the same flag, even if their
fields differ. Value objects have none: two `RolloutPercentage(50)` are interchangeable.

Optionally encode this with a small base class — it's five lines and makes the distinction
explicit rather than conventional:

```typescript
// core/shared/entity.ts
export abstract class Entity {
  protected constructor(readonly id: string) {}
  equals(other: Entity): boolean {
    return other.constructor === this.constructor && other.id === this.id;
  }
}
```

---

## 3. Shared

```
core/shared/
├── entity.ts            abstract class Entity              (§2)
├── email.vo.ts          class Email
├── id-generator.ts      interface IIdGenerator
├── clock.ts             interface IClock
├── token-generator.ts   interface ITokenGenerator
├── password-hasher.ts   interface IPasswordHasher
├── token-hasher.ts      interface ITokenHasher
└── email-sender.ts      interface IEmailSender
```

### `Email`

```typescript
class Email {
  readonly value: string;
  constructor(input: string) {
    const normalized = input.trim().toLowerCase();
    // validate shape; throw on invalid
    this.value = normalized;
  }
}
```

**Normalization is load-bearing, not cosmetic.** Email is the account-linking key (§4.3). If
`Victim@Example.com` and `victim@example.com` compare as different values, linking silently
fails and you get duplicate accounts for one person. Normalize once, in the value object, so it's
impossible to skip.

### Ports

| Port              | Contract                                                                 | Why it's a port                                        |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `IIdGenerator`    | `generate(): string`                                                     | Entropy is environmental. Fakes give tests stable ids. |
| `IClock`          | `now(): Date`                                                            | Time is environmental. Lets tests control expiry.      |
| `ITokenGenerator` | `generate(): string`                                                     | High-entropy secrets (API keys, invite tokens).        |
| `IPasswordHasher` | `hash(plain): Promise<string>` / `verify(plain, hash): Promise<boolean>` | bcrypt/argon2 is an npm dep — can't live in core.      |
| `ITokenHasher`    | `hash(token): string` / `verify(token, hash): boolean`                   | Same, for high-entropy secrets.                        |
| `IEmailSender`    | `send(to: Email, message): Promise<void>`                                | Reaches an external service.                           |

**`IPasswordHasher` and `ITokenHasher` are deliberately separate ports**, and it's a security
distinction, not tidiness. Passwords are low-entropy and need deliberately slow hashing
(bcrypt/argon2). API keys and invite tokens are 32 bytes of randomness, where SHA-256 is
sufficient and fast. This matters concretely: **every SDK rules request authenticates an API
key**, so bcrypting it would burn ~100ms of CPU per poll, per customer instance.

`IIdGenerator` and `ITokenGenerator` are also separate despite both returning random strings. IDs
are public and may appear in URLs; tokens are secrets that must be unguessable. Same shape,
different threat model — keep them from being casually swapped.

---

## 4. User & authentication

```
core/user/
├── user.entity.ts             class User
├── user.repository.ts         interface IUserRepository
├── oauth-account.entity.ts    class OAuthAccount
├── oauth-account.repository.ts interface IOAuthAccountRepository
└── oauth-provider.vo.ts       enum OAuthProvider
```

### `User`

```typescript
class User extends Entity {
  readonly email: Email; // immutable in v1 (§4.4)
  private _name: string;
  private _passwordHash: string | null; // opaque to core; IPasswordHasher produced it
  private _emailVerifiedAt: Date | null;
  readonly createdAt: Date;

  get isEmailVerified(): boolean;
  get hasPassword(): boolean;
  verifyEmail(now: Date): void;
  setPassword(hash: string): void;
  changeName(name: string): void;
}
```

A user exists independently of any org. Signing up creates a `User` and nothing else — there is a
real "signed up, no org yet" state the dashboard must handle. `User` therefore holds **no
`orgId`**; membership is `Member`'s job (§6).

`passwordHash` is `null` for users who only ever signed in with Google.

### `OAuthAccount`

```typescript
class OAuthAccount extends Entity {
  readonly userId: string;
  readonly provider: OAuthProvider; // Google in v1; Github/Apple slot in later
  readonly providerAccountId: string; // the provider's stable subject id, not the email
  readonly createdAt: Date;
}

enum OAuthProvider {
  Google = "google",
}
```

One `User` has many `OAuthAccount`s — that's what "one user, multiple sign-in methods" means. The
password is an attribute of the user; an OAuth account is a link to an external identity. They're
genuinely different things, so they're modeled differently rather than forced into one shape.

Match on `providerAccountId`, never on the email in the OAuth profile — a provider's email can
change, but the subject id is stable.

### 4.3 Account linking, and the attack it must not enable

The product rule: sign up with email/password, later sign in with Google using the same address,
and it's one account with two ways in.

The naive implementation of that rule is exploitable. **The pre-registration attack:** an attacker
signs up with email/password as `victim@example.com` — an address they don't control, and nothing
stops them, because password signup proves nothing about ownership. Later the real victim signs in
with Google. The system sees a matching email, merges, and the victim's account now carries an
attacker-known password. The attacker logs in and reads everything.

The danger is not on Google's side — Google asserts `email_verified`, so a Google identity is
trustworthy proof of ownership. The danger is merging **into an unverified password account** that
anyone could have created.

**The rule:** only ever link into an account whose email is verified. Which forces the
consequence below.

### 4.4 Consequences

**Email verification is v1, not v2.** A password account is unusable until the address is
verified. Once every account holding `victim@example.com` provably belongs to whoever controls
that inbox, merging on email is safe by construction. This is also why `IEmailSender` is a v1
port — invitations need it too (§6.3).

**Email is immutable in v1.** It's the linking key, so changing it means re-verification plus
reconciling any OAuth account whose provider still asserts the old address. Deliberately deferred:
changing an email is a designed flow, not a field update.

**A user always has at least one way in.** `passwordHash` set, or at least one `OAuthAccount`.
Unlinking the last OAuth account when no password exists must be refused — otherwise you lock a
user out of their own account (§10).

Sessions are **not** modeled here. They're an auth-infrastructure concern; the delivery layer
resolves a session into a domain `User`, and `core` never hears about cookies. This is also what
keeps the SDK — which has no sessions at all — able to depend on `core`.

---

## 5. Org

```typescript
// core/org/org.entity.ts
class Org extends Entity {
  private _name: string;
  readonly createdAt: Date;
  rename(name: string): void;
}
```

**There is no `ownerId`.** The owner is the `Member` whose role is `Owner`. Storing it on `Org` as
well would create two sources of truth that can silently disagree, and transferring ownership
would mean remembering to update both. This is the brief's §6.5.2 lesson applied: ownership is a
role-bearing relationship, and relationships are entities.

The invariant "an org has exactly one owner" therefore can't live on `Org` — it has no access to
members. It lives in use-cases (§10).

---

## 6. Membership

```
core/member/
├── member.entity.ts       class Member
├── member.repository.ts   interface IMemberRepository
├── role.vo.ts             enum Role + ROLE_PERMISSIONS
├── invitation.entity.ts   class Invitation
└── invitation.repository.ts
```

### `Member`

```typescript
class Member extends Entity {
  readonly orgId: string;
  readonly userId: string;
  private _role: Role;
  readonly createdAt: Date;

  get isOwner(): boolean;
  changeRole(role: Role): void;
}
```

The join entity between `User` and `Org`, carrying the role. Because it's an entity rather than an
array on either side, "owns one org, is a low-privilege member of another" falls out naturally
instead of needing a special case.

### `Role`

```typescript
enum Role {
  Owner = "owner",
  Admin = "admin",
  Member = "member",
}

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.Owner]: [
    "org:manage",
    "project:manage",
    "flag:manage",
    "member:manage",
  ],
  [Role.Admin]: ["project:manage", "flag:manage", "member:read"],
  [Role.Member]: ["project:read", "flag:read"],
};
```

Plain data. CASL never appears here — `apps/*/lib/casl` reads this table and builds an `Ability`
from it. That's what lets the SDK depend on `core` without dragging CASL along.

### 6.3 `Invitation`

```typescript
class Invitation extends Entity {
  readonly orgId: string;
  readonly email: Email; // invitee may have no account yet
  readonly role: Role; // role granted on acceptance
  readonly tokenHash: string; // ITokenHasher; raw token goes in the email only
  private _status: InvitationStatus;
  readonly expiresAt: Date;
  readonly invitedByUserId: string;
  readonly createdAt: Date;

  isExpired(now: Date): boolean; // computed, not stored
  accept(now: Date): void; // throws if not Pending or already expired
  revoke(): void;
}

enum InvitationStatus {
  Pending = "pending",
  Accepted = "accepted",
  Revoked = "revoked",
}
```

**Invites an email, not a userId** — the invitee may not have an account, which is exactly the
"user exists without an org" case. Accepting is therefore a two-step flow: sign up (or sign in),
then become a member.

**`Expired` is not a status.** It's computed from `expiresAt`, so no background job is needed to
sweep stale rows into an expired state. Storing it would mean an invitation's status depends on
whether a cron ran.

**The token is hashed at rest** and the raw value appears only in the email — same treatment as an
API key, same `ITokenHasher`. A leaked database must not yield working invite links.

---

## 7. Projects & flags

```
core/project/
├── project.entity.ts      class Project
└── project.repository.ts

core/flag/
├── flag.entity.ts             class Flag
├── flag.repository.ts         interface IFlagRepository
├── flag-key.vo.ts             class FlagKey
├── rollout-percentage.vo.ts   class RolloutPercentage
├── targeting-rule.ts          interface TargetingRule + implementations
├── bucketing.ts               pure hash — the "must never vary" thing
└── evaluation-context.ts      type EvaluationContext
```

### 7.1 `Project`

```typescript
class Project extends Entity {
  readonly orgId: string;
  private _name: string;
  readonly createdAt: Date;

  // [v2] — exists only to authenticate an installed SDK, which v1 doesn't have:
  // private _apiKeyHash: string;   // ITokenHasher; raw key shown once at creation
  // rotateApiKey(hash: string): void;
}
```

The container flags live under, and (in v2) the unit an installed SDK authenticates against.

**`apiKeyHash` is deferred with the SDK.** Nothing consumes flags at runtime in v1, so there is no
key to authenticate — adding a credential nobody uses is surface area with no purpose. It returns
in v2 as one field plus a hash on creation, not a redesign.

Note this doesn't remove `ITokenHasher` or `ITokenGenerator` from v1 — invitations still need both
(§6.3).

### 7.2 `Flag`

```typescript
class Flag extends Entity {
  readonly projectId: string;
  readonly key: FlagKey; // immutable — customer code references it
  private _description: string;
  private _enabled: boolean; // the master switch
  private _targetingRules: TargetingRule[]; // ordered; first match wins
  private _rolloutPercentage: RolloutPercentage;
  private _defaultValue: boolean; // fallthrough when enabled and nothing matched
  readonly createdAt: Date;
  private _updatedAt: Date;

  evaluate(context: EvaluationContext): boolean;
  enable(now: Date): void;
  disable(now: Date): void;
  updateRules(
    rules: TargetingRule[],
    rollout: RolloutPercentage,
    now: Date,
  ): void;
}
```

**`key` is immutable.** It's the identifier customers hardcode into their source. Renaming it
would silently break their app at runtime — that's a delete-and-recreate, not an edit.

### 7.3 Evaluation

Evaluation lives on the entity, not only in a use-case. It's pure domain logic with no
orchestration and no I/O — it _is_ the business rule of a flag:

```typescript
evaluate(context: EvaluationContext): boolean {
  if (!this._enabled) return false;                       // kill switch overrides everything
  for (const rule of this._targetingRules) {              // ordered; first match wins
    if (rule.matches(context)) return rule.value;
  }
  if (this._rolloutPercentage.includes(context.key, this.key.value)) return true;
  return this._defaultValue;                              // fallthrough
}
```

`disable()` is a true kill switch: it short-circuits before any rule is consulted, so turning a
flag off genuinely turns it off for everyone — including users named explicitly in a targeting
rule. That's the headline product promise ("seconds, not an incident response") and it only holds
because the check comes first.

`EvaluateFlagUseCase` becomes a thin thing: load the flag, call `evaluate` — used by the
dashboard's "test this rule" preview. The SDK, which already holds the flag in cache, calls
`flag.evaluate(ctx)` directly with no use-case in the path.

### `EvaluationContext`

```typescript
type EvaluationContext = {
  key: string; // stable id of the subject
  attributes?: Record<string, string | number | boolean>; // v2 attribute targeting
};
```

**Deliberately not called `UserContext`.** FlagBase has a `User` entity — someone who logs into
your dashboard. The subject of an evaluation is the _customer's_ end-user, an entirely unrelated
person. Two things called `User` in one codebase, meaning different people, is a bug factory.

`key` is required, because percentage rollout can't bucket without a stable identifier. For
anonymous traffic the caller must supply something stable (a session id) — see §11.

### 7.4 `RolloutPercentage` and bucketing

```typescript
class RolloutPercentage {
  constructor(readonly value: number) {
    // integer, 0..100 — throws otherwise
  }
  includes(subjectKey: string, flagKey: string): boolean {
    return bucketOf(subjectKey, flagKey) < this.value; // 0 → never, 100 → always
  }
}
```

```typescript
// core/flag/bucketing.ts — pure, no imports, ~20 lines (FNV-1a or murmur3)
export function bucketOf(subjectKey: string, flagKey: string): number {
  return hash(`${flagKey}:${subjectKey}`) % 100; // 0..99
}
```

**Hashing `flagKey + subjectKey`, not `subjectKey` alone, is deliberate.** If the subject key were
hashed by itself, the same user would land in the same bucket for _every_ flag — so a user unlucky
enough to be in bucket 3 would be in the first 5% of every single rollout across the platform,
forever. Salting with the flag key makes each flag's bucketing independent.

**This function freezes the moment the SDK ships.** Changing the hash re-buckets every user of
every flag simultaneously — a silent, platform-wide, un-debuggable behavior change.

The one upside of deferring the SDK: it isn't frozen _yet_. No customer depends on this bucketing
in v1, so the algorithm is still cheap to change. That window closes permanently with the first
v2 SDK release — so if there's a reason to revisit the hash choice, revisit it now.

### `TargetingRule`

```typescript
interface TargetingRule {
  readonly value: boolean; // what to return on a match
  matches(context: EvaluationContext): boolean;
}

class UserIdListRule implements TargetingRule {
  // the only rule type in v1
  constructor(
    readonly userIds: string[],
    readonly value: boolean,
  ) {}
  matches(context: EvaluationContext): boolean {
    return this.userIds.includes(context.key);
  }
}
```

New rule types (attribute matching, in v2) implement this interface. They do **not** add branches
to `evaluate()` — that's the OCP commitment from `BACKEND_ARCHITECTURE.md` §3.

### `FlagKey`

```typescript
class FlagKey {
  readonly value: string;
  constructor(input: string) {
    // lowercase alphanumeric + dashes, bounded length; throws otherwise
  }
}
```

---

## 8. Platform admin — [v2]

> **Deferred with `apps/admin`** (`SYSTEM_DESIGN.md` §0). Not built in v1. Kept here because the
> "separate actor" decision constrains `Role` _now_: it's what rules out bolting an
> `isSuperAdmin` flag onto `User` in v1 — the shortcut that would be cheapest today and worst
> later.

```typescript
// core/platform-admin/
class PlatformAdmin extends Entity {
  readonly email: Email;
  private _role: PlatformRole;
  readonly createdAt: Date;
}

enum PlatformRole {
  SuperAdmin = "super_admin",
  Support = "support",
}

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
  [PlatformRole.SuperAdmin]: [
    "org:list",
    "org:read",
    "project:read",
    "flag:read",
  ],
  [PlatformRole.Support]: ["org:list", "org:read"],
};
```

A completely separate actor from `User` — its authority isn't derived from membership in any
tenant, it operates across all of them. Same shape as `Role`, entirely different vocabulary
(cross-tenant operations, not tenant-scoped ones). See `BACKEND_ARCHITECTURE.md` §8.

---

## 9. Entity map

```
User ──< OAuthAccount                       one user, many sign-in methods
 │
 └──< Member >── Org                        the join; carries Role
                  │
                  ├──< Invitation           by email; invitee may have no User yet
                  │
                  └──< Project              container for flags (SDK auth unit in v2)
                        │
                        └──< Flag
                              ├── FlagKey            (vo, immutable)
                              ├── RolloutPercentage  (vo)
                              └──< TargetingRule     (ordered; first match wins)

PlatformAdmin  [v2]                         separate actor; no tenant relationship
```

---

## 10. Where each invariant lives

| Invariant                                           | Enforced in                                              |
| --------------------------------------------------- | -------------------------------------------------------- |
| `RolloutPercentage` is an integer 0–100             | VO constructor                                           |
| `FlagKey` format                                    | VO constructor                                           |
| `Email` shape + normalization                       | VO constructor                                           |
| Invitation not expired / still pending on accept    | `Invitation.accept(now)`                                 |
| Flag disabled ⇒ evaluates false for everyone        | `Flag.evaluate()`                                        |
| Email unique across users                           | use-case + **DB unique index**                           |
| Flag key unique per project                         | use-case + **DB unique index**                           |
| One membership per (org, user)                      | use-case + **DB unique index**                           |
| One OAuth account per (provider, providerAccountId) | use-case + **DB unique index**                           |
| An org has exactly one owner                        | use-cases: create-org, change-member-role, remove-member |
| A user always has ≥1 way to sign in                 | use-case: unlink-oauth-account                           |
| Link only into a verified account (§4.3)            | use-case: sign-in-with-oauth                             |

The pattern: **entity-local rules go in constructors and methods; cross-row rules go in use-cases
and are backstopped by a database constraint.** The DB index isn't redundant — it's what holds
when two requests race, which a use-case check alone cannot prevent.

---

## 11. Open questions

**Transactions are now v1-blocking, not deferred.** `CreateOrgUseCase` writes an `Org` _and_ its
owner `Member` — an org with no owner is a corrupt state that violates §10. `AcceptInvitationUseCase`
writes a `Member` and updates the `Invitation`. Both are multi-document writes that must not
half-succeed. Handing a Mongo session to a use-case without leaking Mongoose into `core` needs a
Unit-of-Work-style port. This was listed as "not urgent for v1" in `BACKEND_ARCHITECTURE.md` §13 —
team management landing in v1 changed that.

**Email provider — the only true v1 blocker here.** `IEmailSender` needs an adapter (Resend,
Postmark, SES — free tiers exist for all). Nothing works without it: email verification gates
password signup, and invitations gate team management. Both are v1.

**Anonymous evaluation.** `EvaluationContext.key` is required, so evaluating a flag for a
logged-out visitor means supplying something stable (a session id). The alternative is an optional
key that skips rollout and returns `defaultValue`. **Deferring the SDK de-risked this** — with no
published API, it's no longer a breaking change to revisit. Decide before v2 ships.

**Platform admin authentication [v2].** `PlatformAdmin` has no password or OAuth account modeled.
Deferred with `apps/admin`; a manual DB seed plus a separate login is probably enough for a single
operator.

**Invitation expiry window.** `expiresAt` exists; nothing decides whether that's 24 hours or 7
days.

Still open from `BACKEND_ARCHITECTURE.md` §13 and unaffected by this document: error handling
across the use-case boundary, input validation placement, and whether routes return entities or
DTOs.
