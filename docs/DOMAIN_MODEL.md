# FlagBase — Domain Model

The entities, value objects, ports, and invariants of `packages/core`. This is the reference for
what exists in the domain and where each rule is enforced.

Architectural rules for `core` (purity, the import matrix, SOLID) live in
`BACKEND_ARCHITECTURE.md`. This document is about _what is modeled_, not how the layers relate.

**v1 scope.** Everything here is v1 except items marked **[v2]** — currently `PlatformAdmin` (§9)
and `Project`'s API key (§8.1), both of which exist only to serve deliverables deferred out of v1
(`SYSTEM_DESIGN.md` §0). `Flag.evaluate()` stays in v1 despite nothing consuming it at runtime: it
is the domain's central business rule and the whole reason the project exists.

**Auth is email + password only.** OAuth/Google sign-in and email verification were removed for
simplicity (2026-07-17). If you're reading an older draft that mentions `OAuthAccount`, account
linking, or the pre-registration attack — that design is gone.

---

## 1. Two principles this model follows

**Inject what varies by environment; keep pure what must never vary.**

IDs need real entropy and time needs a real clock — both are environmental, so both are ports
injected from outside (`IIdGenerator`, `IClock`). Rollout bucketing is the opposite: it must
produce byte-identical results in the dashboard, in a customer's Node server, and in a Cloudflare
Worker, forever. So it's pure math written directly in `core` (§8.4). If bucketing were injected,
two implementations could disagree and the same user would flicker in and out of a feature
depending on which process evaluated them.

**Invariants live at the narrowest scope that can enforce them.**

A rule that needs only the entity's own fields (`RolloutPercentage` is 0–100) goes in a
constructor. A rule that needs to see other rows ("an organization has exactly one owner") cannot
live on an entity — it goes in a use-case, backed by a database constraint. §11 maps every
invariant to its home.

---

## 2. Current structure

```text
packages/core/src/
├── shared/                 — the kernel: base class, Email, Password, errors (pure; NO ports)
│   ├── entity.ts
│   ├── email.vo.ts
│   ├── password.vo.ts
│   └── errors.ts
├── domain/
│   ├── user/               user.entity, user.repository
│   ├── organization/       organization.entity, organization.repository
│   ├── member/             member.entity, member.repository, role.vo
│   ├── invitation/         invitation.entity, invitation.repository
│   ├── project/            project.entity, project.repository
│   └── flag/               flag.entity, flag.repository, flag-key.vo,
│                           rollout-percentage.vo, targeting-rule, bucketing,
│                           evaluation-context
├── application/            — the use-case layer
│   ├── ports/              ALL ports (IClock, IIdGenerator, hashers, IEmailSender,
│   │                       IUnitOfWork) + barrel — infrastructure implements them
│   └── use-cases/          by ACTION, one folder each (Flag + Auth + org/member slices built)
│       └── use-case.ts     interface IUseCase<TInput, TOutput> — the shared contract
├── lib/                    supporting/tooling — test-only, never exported
│   └── test-support/       in-memory fakes: repositories, clock, id generator, unit-of-work
└── index.ts                the package's public surface
```

`shared/` (kernel), `domain/`, and `application/` are honest peers; `lib/` holds test-only tooling
(pure, never re-exported, so it doesn't affect core's purity). Ports live in `application/ports/`,
not the kernel — they're interfaces the application layer declares for what it needs from outside,
so `shared/` stays pure primitives. `invitation/` is its own feature folder, not nested under
`member/` — it's a distinct aggregate with its own lifecycle.

---

## 3. Identity and equality

Entities have identity: two `Flag` objects with the same `id` are the same flag, even if their
fields differ. Value objects have none: two `RolloutPercentage(50)` are interchangeable.

`shared/entity.ts` encodes this in a five-line base class every entity extends:

```typescript
export abstract class Entity {
  protected constructor(readonly id: string) {}
  equals(other: Entity): boolean {
    return other.constructor === this.constructor && other.id === this.id;
  }
}
```

Comparing constructors as well as ids means an `Organization` and a `Flag` that happen to share
an id string are not treated as equal.

---

## 4. Shared kernel

### `Email`

A value object. Its constructor normalizes (trim + lowercase) and validates shape, so an invalid
or unnormalized `Email` cannot exist anywhere in the system.

Normalization is load-bearing, not cosmetic. Email is the login identifier and unique key. If
`Aashir@Example.com` and `aashir@example.com` compared as different values, you'd get duplicate
accounts for one person and a lookup that misses. Normalizing once, in the constructor, makes that
impossible to skip at a call site.

### Ports

Interfaces `core` declares and infrastructure implements. All live in `application/ports/` (the
use-case layer, not the kernel — ports are what the application needs from outside).

| Port              | Contract                                                                 | Why it's a port                                        |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `IIdGenerator`    | `generate(): string`                                                     | Entropy is environmental. Fakes give tests stable ids. |
| `IClock`          | `now(): Date`                                                            | Time is environmental. Lets tests control expiry.      |
| `ITokenGenerator` | `generate(): string`                                                     | High-entropy secrets (invitation tokens).              |
| `IPasswordHasher` | `hash(plain): Promise<string>` / `verify(plain, hash): Promise<boolean>` | argon2 is an npm dep — can't live in core.             |
| `ITokenHasher`    | `hash(token): string` / `verify(token, hash): boolean`                   | SHA-256 of a high-entropy secret.                      |
| `IEmailSender`    | `sendInvitation(to, token, organizationName): Promise<void>`             | Reaches an external service.                           |

**`IPasswordHasher` and `ITokenHasher` are deliberately separate ports**, and it's a security
distinction, not tidiness. Passwords are low-entropy and need deliberately slow hashing (argon2).
Invitation tokens are 32 bytes of randomness, where fast SHA-256 is sufficient — and in v2, where
every SDK poll authenticates an API key, a slow hash there would burn ~100ms of CPU per request
for no gain.

`IIdGenerator` and `ITokenGenerator` are also separate despite both returning random strings. IDs
are public and may appear in URLs; tokens are secrets that must be unguessable. Same shape,
different threat model.

`IEmailSender` methods are semantic (`sendInvitation`, not `send(subject, body)`) — subject lines
and templates are presentation, which doesn't belong in the domain. `core` decides an invitation
must go out and supplies the token; infrastructure decides what the email looks like.

> None of these ports are _implemented_ yet — the implementations (argon2, SHA-256, `crypto.randomUUID`,
> a system clock, an email adapter) land with the use-case layer that needs them.

---

## 5. User & authentication

```text
core/domain/user/
├── user.entity.ts       class User
└── user.repository.ts   interface IUserRepository
```

### `User`

```text
User
  id            string
  email         Email    — immutable in v1; the login identifier
  name          string   — display name
  passwordHash  string   — every user authenticates with a password
  createdAt     Date
```

**Auth is email + password only.** Every user has a password, so `passwordHash` is a required,
non-null string — a passwordless `User` cannot be constructed (the constructor rejects an empty
hash). There is no OAuth, no email verification, no `emailVerifiedAt`.

The hash is opaque to `core` — `IPasswordHasher` (argon2) produces it in the sign-up use-case, and
`core` never sees a plaintext password. `setPassword(hash)` exists for reset/change; it too takes
an already-hashed value.

A `User` exists independently of any organization: signing up creates a `User` and nothing else,
so "signed up, no organization yet" is a real state the dashboard must handle. Membership lives in
`Member` (§6), never as an `organizationId` on `User`.

**Email is immutable in v1.** It's the login identifier and unique key; changing it is a designed
flow, not a field setter. Deliberately deferred.

Sessions are **not** modeled here. They're an auth-infrastructure concern; the delivery layer
resolves a session into a domain `User`, and `core` never hears about cookies.

---

## 6. Organization & membership

### `Organization`

```text
Organization
  id         string
  name       string
  createdAt  Date
```

**There is no `ownerId`.** The owner is the `Member` whose role is `Owner`. Storing it here as
well would create two sources of truth that can silently disagree, and transferring ownership
would mean remembering to update both. Ownership is a role-bearing relationship, and relationships
are entities. The invariant "exactly one owner" therefore can't live on `Organization` — it lives
in use-cases (§11).

### `Member`

```text
Member
  id              string
  organizationId  string
  userId          string
  role            Role
  createdAt       Date
```

The join between `User` and `Organization`, carrying the role. Because it's an entity rather than
an array on either side, "owns one organization, is a low-privilege member of another" falls out
naturally instead of needing a special case.

### `Role`

```typescript
enum Role {
  Owner = "owner",
  Admin = "admin",
  Member = "member",
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Owner]: [
    "organization:manage",
    "project:manage",
    "flag:manage",
    "member:manage",
  ],
  [Role.Admin]: ["project:manage", "flag:manage", "member:read"],
  [Role.Member]: ["project:read", "flag:read"],
};
```

Plain data. CASL never appears in `core` — the delivery layer reads this table and builds an
`Ability` from it. `manage` is not listed alongside `read` for the same subject because at the
CASL layer `manage` subsumes every action, so `flag:manage` already implies `flag:read`.

---

## 7. Invitation

```text
core/domain/invitation/
├── invitation.entity.ts       class Invitation + enum InvitationStatus
└── invitation.repository.ts   interface IInvitationRepository
```

```text
Invitation
  id               string
  organizationId   string
  email            Email             — invitee may have no account yet
  role             Role              — never Owner
  tokenHash        string            — raw token lives only in the email
  status           InvitationStatus  — pending | accepted | revoked
  expiresAt        Date
  invitedByUserId  string
  createdAt        Date
  acceptedAt       Date | null
```

**Invites an email, not a userId** — the invitee may not have an account yet, which is exactly the
"signed up, no organization" / "no account at all" case. Accepting is therefore two steps:
authenticate (signing up if needed), then become a member.

**`Expired` is not a status.** It's computed from `expiresAt`, so no background job is needed to
sweep stale rows. Storing it would make an invitation's meaning depend on whether a cron ran.

**Cannot invite as Owner.** An organization has exactly one owner, so granting Owner through an
invitation would create a second or displace the existing one. The constructor rejects it;
transferring ownership is a separate, deliberate operation.

**The token is hashed at rest**, appearing in cleartext only in the outbound email — same
treatment as a password. A leaked database must not yield working invite links.

State machine: `accept(now)` and `revoke()` both throw `ConflictError` from any non-pending state,
and `accept` also throws once expired. `isExpired(now)` and `isAcceptable(now)` are computed.

---

## 8. Projects & flags

### 8.1 `Project`

```text
Project
  id              string
  organizationId  string
  name            string
  createdAt       Date

  apiKeyHash      string  — [v2] added with the SDK; no runtime consumer in v1
```

The container flags live under, and — in v2 — the unit an installed SDK authenticates against. The
API key is deferred with the SDK: nothing consumes flags at runtime in v1, so there's no key to
authenticate, and a credential nobody uses is just attack surface.

### 8.2 `Flag`

```text
Flag
  id                 string
  projectId          string
  key                FlagKey            — immutable; customers hardcode it
  description        string
  enabled            boolean            — master kill switch, checked first
  targetingRules     TargetingRule[]    — ordered; first match wins
  rolloutPercentage  RolloutPercentage
  defaultValue       boolean            — fallthrough when enabled and nothing matched
  createdAt          Date
  updatedAt          Date
```

`Flag.create()` ships dark: disabled, no rules, 0% rollout, `defaultValue` false unless specified.
Creating a flag never exposes a feature until someone deliberately enables it. `key` is immutable
(no setter) — it's the identifier customers hardcode, so a rename is delete-and-recreate.

### 8.3 Evaluation

`evaluate()` lives on the entity, not only in a use-case. It's pure domain logic with no
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

The disabled check comes first and that ordering is the contract: `disable()` is a true kill
switch that overrides everything, including a targeting rule that names a user explicitly. That's
the headline product promise ("seconds, not an incident response") and it only holds because
nothing is consulted before that line.

`EvaluationContext` is deliberately **not** called `UserContext`. FlagBase has a `User` entity —
someone who logs into the dashboard. The subject of an evaluation is the _customer's_ end user, an
entirely different person. `key` is required because percentage rollout can't bucket without a
stable identifier; `attributes` exists for v2 attribute targeting and is unused in v1.

### 8.4 `RolloutPercentage` and bucketing

`RolloutPercentage` is a value object validated 0–100 in its constructor. `includes(subjectKey,
flagKey)` returns `bucketOf(subjectKey, flagKey) < value`, so 0 includes nobody and 100 everybody.

`bucketing.ts` is pure FNV-1a over the UTF-8 bytes of `` `${flagKey}:${subjectKey}` ``, mapped into
0–99. Two deliberate choices:

- **UTF-8 bytes, not `charCodeAt`** — so a future non-JS SDK (Python, Go) buckets a non-ASCII
  subject identically. For ASCII the two are the same; the difference only appears with non-ASCII
  keys, at which point a mismatch would split a user across processes.
- **Salted with the flag key** — hashing the subject alone would put a user in the same bucket for
  every flag, so an unlucky user would be in the first 5% of every rollout on the platform.

**This function freezes the moment the SDK ships.** Changing the hash re-buckets every user of
every flag simultaneously — silent, platform-wide, undebuggable. There's a canary test recording
known outputs; if it fails, the hash changed. It is _not_ frozen yet (no SDK consumes it), so if
there's ever a reason to revisit the algorithm, now is the only free window.

### 8.5 `TargetingRule`

```typescript
interface TargetingRule {
  readonly value: boolean;
  matches(context: EvaluationContext): boolean;
}

class UserIdListRule implements TargetingRule {
  /* the only rule type in v1 */
}
```

New rule types (attribute matching, v2) implement this interface. They do **not** add branches to
`evaluate()` — that's the OCP commitment. `UserIdListRule` holds its ids in a `Set` for O(1)
membership and rejects an empty list (an empty rule could never match).

---

## 9. Platform admin — [v2]

> **Deferred with `apps/admin`** (`SYSTEM_DESIGN.md` §0). Not built. Recorded because the "separate
> actor" decision constrains `Role` _now_: it's what rules out bolting an `isSuperAdmin` flag onto
> `User` in v1 — the shortcut that's cheapest today and worst later.

`PlatformAdmin` will be a completely separate actor from `User` — its authority isn't derived from
membership in any tenant, it operates across all of them. Same shape as `Role`, entirely different
vocabulary (`organization:list`, `organization:read` — cross-tenant, not tenant-scoped).

---

## 10. Entity map

```text
User ──< Member >── Organization           Member is the join; carries Role
                     │
                     ├──< Invitation        by email; invitee may have no User yet
                     │
                     └──< Project           container for flags (SDK auth unit in v2)
                           │
                           └──< Flag
                                 ├── FlagKey            (vo, immutable)
                                 ├── RolloutPercentage  (vo)
                                 └──< TargetingRule     (ordered; first match wins)

PlatformAdmin  [v2]                         separate actor; no tenant relationship
```

---

## 11. Where each invariant lives

| Invariant                                        | Enforced in                                              |
| ------------------------------------------------ | -------------------------------------------------------- |
| `RolloutPercentage` is an integer 0–100          | VO constructor                                           |
| `FlagKey` format                                 | VO constructor                                           |
| `Email` shape + normalization                    | VO constructor                                           |
| A user always has a (non-empty) password         | `User` constructor                                       |
| Invitation not expired / still pending on accept | `Invitation.accept(now)`                                 |
| Cannot invite as Owner                           | `Invitation` constructor                                 |
| Flag disabled ⇒ evaluates false for everyone     | `Flag.evaluate()`                                        |
| Email unique across users                        | use-case + **DB unique index**                           |
| Flag key unique per project                      | use-case + **DB unique index**                           |
| One membership per (organization, user)          | use-case + **DB unique index**                           |
| An organization has exactly one owner            | use-cases: create-org, change-member-role, remove-member |

The pattern: **entity-local rules go in constructors and methods; cross-row rules go in use-cases
and are backstopped by a database constraint.** The DB index isn't redundant — it's what holds
when two requests race, which a use-case check alone cannot prevent. Every unique index above is
already built in `infrastructure` and translates a collision into a domain `ConflictError`.

Note what removing OAuth deleted from this table: the "a user always has ≥1 way to sign in" rule
collapsed into the plain constructor check above, because there's no longer a passwordless path.

---

## 12. Conventions

Established while building `core`; follow them for new entities.

- **Static `create()` factory** for new instances (stamps `createdAt`, applies defaults); the
  `constructor(props)` is the full-fidelity path the persistence mapper uses to rehydrate.
- **Mutating methods take `now: Date`** (`flag.enable(now)`) rather than reading a clock — keeps
  entities pure, with the `IClock` port living at the use-case layer.
- **A schema comment block** at the top of each entity file lists its persisted field shape at a
  glance.
- **Value objects are immutable and compared by value** (`equals`); entities carry identity.

---

## 13. Open questions

**Transactions are v1-blocking.** `CreateOrganizationUseCase` writes an `Organization` _and_ its
owner `Member` — an org with no owner is a corrupt state that violates §11. `AcceptInvitationUseCase`
writes a `Member` and updates the `Invitation`. Both are multi-document writes that must not
half-succeed. Handing a Mongo session to a use-case without leaking Mongoose into `core` needs a
Unit-of-Work-style port. This is the first thing to resolve when the use-case layer starts.

**Error handling across the boundary.** `core` throws typed `DomainError`s (`ValidationError`,
`NotFoundError`, `ConflictError`, `ForbiddenError`), each with a `code`. The route layer maps
`code` → HTTP status. That mapping table doesn't exist yet — it's a delivery-layer concern for
when routes are built.

**Input validation placement.** Entities guard invariants, but something must reject a malformed
JSON body before it reaches a constructor. Zod at the route boundary is the natural fit — but Zod
can't live in `core`, so the schema and the entity invariant risk stating the same rule twice.

**Anonymous evaluation.** `EvaluationContext.key` is required, so evaluating a flag for a
logged-out visitor means the caller supplies something stable (a session id). Deferring the SDK
de-risked this — with no published API, it's no longer a breaking change to revisit. Decide before
v2 ships.

**Email provider.** `IEmailSender` needs an adapter (Resend, Postmark, SES) for invitations. Not
built; blocks the invitation flow.

---

## 14. Build status

- `core` — entities, value objects, ports, repository interfaces: **built and unit-tested** (110
  tests, zero-dependency). Ports declared, not implemented.
- `infrastructure` — Mongoose models, mappers, and repository implementations for all six
  entities: **built and integration-tested** against an in-process MongoDB (34 tests).
- Not yet built: port implementations, the composition root, use-cases, and the apps.
