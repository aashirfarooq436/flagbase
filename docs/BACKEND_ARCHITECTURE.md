# FlagBase — Backend Architecture

The complete backend picture: layers, rules, structure, and the request lifecycle. Self-contained
— read this to write backend code without needing another document open.

**Scope.** Covers `packages/core`, `packages/infrastructure`, `packages/composition`, and the API
delivery layer of `apps/dashboard`. Does not cover the frontend (api-client, hooks) — that lives
in `SYSTEM_DESIGN.md`, which holds the full-stack and monorepo picture.

**v1 boundary.** The SDK, `apps/admin`, and the SDK-facing rules endpoint are deferred to v2
(`SYSTEM_DESIGN.md` §0). Sections marked **[v2]** are designed but not being built. The rules in
this document are written as though all three exist, because they must — the moment `core` is
allowed to assume it's running inside Next.js, adding them back becomes a rewrite.

---

## 1. The one invariant

`core` is pure. It imports nothing — no Mongoose, no CASL, no Next.js, no npm dependency at all.

Everything else in this document is downstream of that sentence. `core` is the center; every
other layer either implements an interface `core` declared, or orchestrates `core` for a specific
delivery context.

This is not stylistic. `packages/core/package.json` carries an empty `dependencies` block, which
makes the rule self-enforcing: `import mongoose` inside an entity fails to resolve at build time
rather than passing review. If you find yourself wanting to add a dependency to `core`, the
design is wrong — not the rule.

In v1 there is exactly one consumer — the customer dashboard — so nothing external is forcing this
rule. That's precisely why the empty `dependencies` block matters: it's the only enforcement left.

The rule is not v1-shaped, though. The same `core` is meant to run in three places with three
different sets of application rules and three different runtimes: the dashboard (Next.js on
Vercel), the platform admin app **[v2]**, and the published SDK inside a customer's own
Node/edge/browser process **[v2]**. Design for all three now. If `core` ever needs forking for one
of them, something has leaked — and you'd discover it in v2, when it's expensive.

---

## 2. Layers

```
                    ┌─────────────────────────────────────┐
   delivery         │  app/api/**/route.ts  +  lib/       │  Next.js, CASL, HTTP
                    └──────────────┬──────────────────────┘
                                   │ imports
                    ┌──────────────▼──────────────────────┐
   wiring           │  packages/composition               │  the only place `new` happens
                    └──────────────┬──────────────────────┘
                                   │ imports
        ┌──────────────────────────┴──────────────────────┐
        │                                                 │
┌───────▼───────────────────┐              ┌──────────────▼──────────────┐
│  packages/infrastructure  │  implements  │      packages/core          │
│  Mongoose, mappers, repos │─────────────▶│  entities, VOs, use-cases,  │
│  (reaches outside proc.)  │              │  repository interfaces      │
└───────────────────────────┘              │  (imports NOTHING)          │
                                           └─────────────────────────────┘
```

Dependencies point inward, always. `infrastructure` knows about `core`; `core` has never heard of
`infrastructure`.

### Import matrix

| Package          | May import                                      | Must never import                           |
| ---------------- | ----------------------------------------------- | ------------------------------------------- |
| `core`           | **nothing** — not even other workspace packages | Mongoose, CASL, Next.js, any npm dependency |
| `infrastructure` | `core`, Mongoose, external-service SDKs         | `composition`, `apps/*`, `sdk`              |
| `composition`    | `core`, `infrastructure`                        | `apps/*`, `sdk`                             |
| `apps/*/api`     | `core`, `composition`, `contracts`, Next, CASL  | `infrastructure` **directly**               |
| `sdk` **[v2]**   | `core` (+ `contracts`, see §13)                 | `infrastructure`, `composition`, `apps/*`   |

The last row matters as much as the first. Apps reach infrastructure only through `composition`.
If a route handler can `new MongoFlagRepository()`, repository wiring lives in as many places as
there are routes and the composition root stops being a root. `composition` is the only importer
of `infrastructure` in the entire system.

### The `infrastructure` vs `lib` line

Both sit outside `core`, and the split is: **does this reach outside the process?**

`infrastructure` talks to the world — the database, third-party APIs, email, webhooks.
`apps/*/lib` orchestrates and decides in memory — decorators compose handlers, CASL computes a
permission decision, hooks manage client state. Nothing in `lib` opens a socket; when it needs to,
it goes through `infrastructure`.

CASL is the clarifying example: it computes a permission decision in memory and reaches nothing,
so it lives in `lib/casl`, not `infrastructure`.

---

## 3. `packages/core`

Everything here is a class. Two organizing principles, deliberately not one:

- **Feature folders** for things owned by a single concept — an entity, its value objects, its
  repository interface.
- **A separate use-case namespace, organized by action** — because use-cases orchestrate _across_
  concepts. `InviteMemberUseCase` touches `Organization`, `Member`, and `User` equally; there's no
  non-arbitrary owner, so the folder structure must not force one.

The top level splits three ways: `shared/` (the kernel — base class, cross-cutting value object,
errors, ports), `domain/` (feature folders), and `use-cases/` (by action). `shared/` and
`use-cases/` are honest peers of `domain/`, not features masquerading as siblings.

```
core/src/
├── shared/                       — the kernel; imports nothing
│   ├── entity.ts                 abstract Entity base (identity + equals)
│   ├── email.vo.ts               class Email — login identifier, normalized
│   ├── errors.ts                 DomainError + Validation/NotFound/Conflict/Forbidden
│   └── ports.ts                  IIdGenerator, IClock, ITokenGenerator,
│                                 IPasswordHasher, ITokenHasher, IEmailSender
├── domain/
│   ├── user/                     User { id, email, name, passwordHash }, IUserRepository
│   ├── organization/             Organization { id, name }  — NO ownerId
│   ├── member/                   Member { id, organizationId, userId, role }, Role
│   ├── invitation/               Invitation + InvitationStatus, IInvitationRepository
│   ├── project/                  Project { id, organizationId, name }
│   └── flag/                     Flag, FlagKey, RolloutPercentage, TargetingRule,
│                                 bucketing, EvaluationContext, IFlagRepository
└── use-cases/                    — [NOT BUILT YET] by ACTION, one folder each
    ├── use-case.ts               interface IUseCase<TInput, TOutput> { execute(input) }
    ├── sign-up/  create-organization/  invite-member/  accept-invitation/
    ├── change-member-role/  remove-member/  create-project/
    ├── create-flag/  toggle-flag/  update-flag-rules/  evaluate-flag/
    └── list-organizations/  [v2, admin]   get-organization-details/  [v2, admin]
```

Auth is email + password only — there is no `OAuthAccount` (removed 2026-07-17). `PlatformAdmin`
and its use-cases are **[v2]** (§8), deferred with the admin app.

### Rules for `core`

**Must:** be plain TypeScript classes. Be deterministic and side-effect-free except through
injected repository interfaces. Express invariants in constructors — a `RolloutPercentage` must
be incapable of existing while holding `150`.

**Must never:** import anything (§2). Know that Mongo exists, that HTTP exists, that CASL exists,
or whether its caller is a Next.js route or an npm package in someone else's Cloudflare Worker.
Hold a denormalized field that exists only for read performance — that's persistence's business.

### SOLID, concretely

- **SRP** — one use-case class per business operation. `ToggleFlagUseCase` does not also validate
  targeting rules; that's `UpdateFlagRulesUseCase`'s job.
- **OCP** — a new targeting rule type implements the `TargetingRule` contract. It does not add an
  `if` branch to `EvaluateFlagUseCase`.
- **LSP** — any `IFlagRepository` implementation (Mongo now, Postgres later, in-memory in tests)
  is swappable without changing use-case behavior.
- **ISP** — repository interfaces stay narrow and declare only what their use-cases actually call.
  Resist a fat generic `IRepository<T>`; it forces implementers to satisfy methods nobody invokes.
- **DIP** — use-cases receive repository _interfaces_ via constructor, injected from outside. A
  use-case that constructs its own dependency is untestable and violates the rule.

### The evaluation engine

`EvaluateFlagUseCase` is the one piece of genuinely hard domain logic. Given a flag's rules and a
user context, it decides `true`/`false`, and it must be:

- **Pure and deterministic** — same rules + same context → same answer, always. No hidden state.
- **Fast** — it may run on every request inside a customer's hot path.
- **I/O-free** — it receives an already-loaded `Flag`; it does not fetch one.

Percentage rollout uses a stable hash of `userId + flagKey` mapped into a 0–100 bucket, never
per-call randomness. A user must land in the same bucket on every evaluation, in every process,
forever — otherwise a user flickers in and out of a feature on page refresh.

---

## 4. `packages/infrastructure`

Mirrors `core`'s `domain/` feature folders 1:1. No use-case mirror — infrastructure has no
use-cases. **Built and integration-tested** against an in-process MongoDB (`mongodb-memory-server`).

```
infrastructure/src/
├── mongoose/
│   └── connection.ts               ensureConnection(uri) — cached, serverless-safe; used by withDb
├── shared/
│   └── mongo-errors.ts             isDuplicateKeyError() — maps code 11000 → ConflictError
├── test-support/
│   └── mongo-test-env.ts           useMongoTestEnv() — spins up an in-process Mongo per test file
└── domain/
    ├── user/                       user.model, user.mapper, mongo-user.repository
    ├── organization/               … model, mapper, mongo-*.repository
    ├── member/                     … (+ unique index on organizationId+userId)
    ├── invitation/                 … (+ unique index on tokenHash)
    ├── project/
    └── flag/                       … (+ unique index on projectId+key; discriminated rule docs)
```

The domain-generated UUID is stored as the document `_id` (a `String`), not a Mongo `ObjectId` —
so the id a use-case mints is the id in the database, and `core` never learns Mongo exists. Port
implementations (argon2 hasher, SHA-256 token hasher, id generator, clock, email adapter) are
**not built yet** — they land with the use-case layer that needs them.

**Must:** implement interfaces `core` declared. Own every Mongoose schema. Own all translation
between persistence shape and domain shape, in mappers.

**Must never:** contain business rules. If a repository method is _deciding_ something rather than
storing or retrieving it, that decision belongs in a use-case.

### Denormalization stops here

Mongo documents may duplicate fields for read performance — copying `organizationName` onto every
`Member` document to avoid a populate is a legitimate persistence decision. It must never reach the
domain. `MemberMapper` drops it on the way in and rebuilds it on the way out; `Member` the entity has no
idea it exists. Persistence-layer denormalization is fine; domain-layer denormalization is not.

### Relationships are entities, not embedded arrays

A user's orgs are not an array on the `User` document. Membership is a role-bearing many-to-many
relationship, so it gets its own `Member` entity. This makes rules like "owns one org, is a
low-privilege member of another" fall out naturally instead of requiring special cases, and avoids
two competing sources of truth.

### Adding non-database adapters

Email, webhooks, and cloud storage join the same way: a concrete class implementing an interface
`core` declared. If an adapter doesn't belong to an existing feature folder (an `EmailSender`
isn't tied to one entity), give it its own top-level folder — `infrastructure/email/` — rather
than forcing it somewhere unrelated.

---

## 5. `packages/composition`

The only place in the system where concrete classes get constructed.

```typescript
// [NOT BUILT YET] — illustrative shape; use-cases and the composition package don't exist.
class CompositionRoot {
  private organizationRepository = new MongoOrganizationRepository();
  private flagRepository = new MongoFlagRepository();

  createFlagUseCase = new CreateFlagUseCase(
    this.flagRepository,
    this.organizationRepository,
  );
  toggleFlagUseCase = new ToggleFlagUseCase(this.flagRepository);
  evaluateFlagUseCase = new EvaluateFlagUseCase();

  // [v2] platform-admin use-cases wire to the SAME repositories, different application rules:
  // listOrganizationsUseCase = new ListOrganizationsUseCase(this.organizationRepository);
}

export const composition = new CompositionRoot();
```

It's a shared package rather than living inside `apps/dashboard` because both apps wire against
the same repositories. Duplicating it per app would create two places that can drift on how a
`MongoFlagRepository` gets built.

**Must never:** contain logic of any kind. It is a wiring diagram that happens to be written in
TypeScript.

Note what this buys: tests never touch this file. They construct
`new CreateFlagUseCase(new InMemoryFlagRepository())` directly, which is only possible because the
use-case never reaches for its own dependencies.

---

## 6. API delivery

Route handlers in Next.js App Router are plain exported functions, so cross-cutting concerns
compose through higher-order functions rather than TypeScript class decorators. Same intent —
layers wrapped around a core action — using the mechanism the framework actually supports.

```typescript
// with-db.ts — ensure a Mongoose connection exists (URI comes from the app's env)
function withDb(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    await ensureConnection(env.MONGODB_URI);
    return handler(req, ctx);
  };
}

// with-auth.ts — resolve the User, else 401
function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const user = await resolveUserFromSession(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return handler(req, { ...ctx, user });
  };
}

// with-ability.ts — CASL check, else 403
function withAbility(action: string, subject: string) {
  return (handler: RouteHandler): RouteHandler =>
    async (req, ctx) => {
      const ability = buildAbilityFor(ctx.user, ctx.organization);
      if (ability.cannot(action, subject)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return handler(req, { ...ctx, ability });
    };
}

// with-app-handlers.ts — the one route authors reach for
function withAppHandlers(
  handler: RouteHandler,
  opts: { action: string; subject: string },
): RouteHandler {
  return withDb(withAuth(withAbility(opts.action, opts.subject)(handler)));
}
```

A route does exactly four things — parse input, call one use-case, map the result, return:

```typescript
// app/api/projects/[projectId]/flags/[flagId]/toggle/route.ts
export const PATCH = withAppHandlers(
  async (req, ctx) => {
    const flag = await composition.toggleFlagUseCase.execute({
      flagId: ctx.params.flagId,
    });
    return NextResponse.json(FlagPresenter.toResponse(flag));
  },
  { action: "manage", subject: "Flag" },
);
```

**Must never:** contain business logic, touch a repository, or call more than one use-case. A
route that needs two use-cases is a signal the use-case boundary is wrong — that orchestration
belongs in a use-case.

This is the single most likely way this codebase decays. In a Next.js repo it is very easy to let
`route.ts` quietly become the use-case layer, with DB calls and rules inline. The stakes are
higher here than in a normal app: **any logic left in `route.ts` is logic the SDK physically
cannot reach**, because the SDK never runs inside Next.js.

### The SDK rules endpoint — [v2]

> **Deferred.** No SDK in v1, so nothing calls this and `Project` carries no API key yet
> (`DOMAIN_MODEL.md` §8.1).

`GET /api/sdk/projects/:id/rules` is backend surface but does **not** use `withAppHandlers`. It
authenticates a **project API key**, not a user session — there is no logged-in user, so
`withAuth` and the CASL chain don't apply. It gets its own thinner chain (`withDb` + an API-key
check) and scopes its response to exactly the one project the key belongs to.

---

## 7. Authorization: where the CASL boundary sits

`core` defines what roles _mean_, as plain data, with no CASL import:

```typescript
// core/domain/member/role.vo.ts
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

The delivery layer's `lib/casl/build-ability.ts` reads that table and translates it into a real CASL `Ability`.
That file is the only place `@casl/ability` is imported anywhere in the system. `core` stays
ignorant that CASL exists, which is what allows the SDK — which has no use for CASL — to depend on
`core` without dragging it along.

---

## 8. Platform admin is a separate actor — [v2]

> **Deferred.** Not built in v1; support happens by querying Mongo directly until then. Recorded
> because the "separate actor" decision constrains how `Role` and auth are modeled _now_ — the
> shortcut it rules out (`if (user.isSuperAdmin)`) is one you'd otherwise take in v1 and regret.

`PlatformAdmin` is not a `Member` with extra powers. Its authority isn't derived from membership
in any tenant — it operates _across_ tenants. Modeling it inside the `Organization`/`Member`/`Role`
system would mean either a fake organization membership or `if (user.isSuperAdmin)` checks leaking
through tenant-scoped logic.

So it gets its own entity, its own `PlatformRole` vocabulary (about cross-tenant operations:
`organization:list`, `organization:read`, later `organization:suspend`), its own repository, and
its own auth chain in `apps/admin` (`withAdminAuth` + `withAdminAbility`) — a completely separate
login, unreachable from the customer surface.

What it _shares_ is the repositories. v1 admin use-cases are read-only and reuse
`IOrganizationRepository`/`IProjectRepository`/`IFlagRepository` unchanged. That's a third consumer
of the same domain model with a third set of application rules — another proof that `core` is
genuinely decoupled rather than nominally so.

---

## 9. Request lifecycle, end to end

### Write path — customer toggles a flag

1. `PATCH /api/projects/:projectId/flags/:flagId/toggle`
2. `withDb` → ensure Mongoose connection
3. `withAuth` → resolve `User` from session, else 401
4. `withAbility('manage', 'Flag')` → build CASL ability from domain `Role`, else 403
5. Route parses `flagId`, calls `composition.toggleFlagUseCase.execute({ flagId })`
6. Use-case loads the `Flag` through `IFlagRepository`, applies the rule, saves
7. `MongoFlagRepository.save()` → `FlagMapper` entity→document → Mongoose → MongoDB
8. Route maps the result to a response and returns

Note what step 6 doesn't know: that an HTTP request exists, that a session exists, that Mongo
exists. That ignorance is the point — it's exactly what lets step 6 also run inside the SDK.

### Read path — SDK evaluating a flag in a customer's runtime — [v2]

1. `GET /api/sdk/projects/:id/rules`, authenticated by project API key (§6)
2. SDK caches the ruleset in memory, refreshed on a poll interval (~30s default)
3. `isFeatureEnabled(key, context)` runs `EvaluateFlagUseCase` **locally** — no network round trip
   per evaluation, fails closed (`false`) if rules haven't loaded

The `EvaluateFlagUseCase` in step 3 is the same class from `core` the dashboard uses — imported,
not reimplemented.

---

## 10. Testing

**Use-cases are tested with zero infrastructure.** Construct the use-case with in-memory fakes
implementing the repository interfaces, assert on business outcomes. No DB connection, no HTTP, no
Next.js.

```typescript
const repo = new InMemoryFlagRepository([existingFlag]);
const useCase = new ToggleFlagUseCase(repo);
await useCase.execute({ flagId: "flag-1" });
expect(repo.findById("flag-1")).toHaveProperty("enabled", false);
```

This is the real check on whether the architecture holds. If testing a use-case requires spinning
up Mongo or faking a `NextRequest`, something has leaked and the fix belongs in the design, not in
the test.

`EvaluateFlagUseCase` deserves the heaviest coverage in the codebase — it's pure, so it's trivial
to test exhaustively, and it's the one function customers' production behavior depends on. Include
a determinism test: the same user + flag must bucket identically across many repeated evaluations.

---

## 11. Conventions

| Thing                | File                                  | Symbol                      |
| -------------------- | ------------------------------------- | --------------------------- |
| Entity               | `flag.entity.ts`                      | `class Flag`                |
| Value object         | `rollout-percentage.vo.ts`            | `class RolloutPercentage`   |
| Repository interface | `flag.repository.ts`                  | `interface IFlagRepository` |
| Repository impl      | `mongo-flag.repository.ts`            | `class MongoFlagRepository` |
| Mongoose schema      | `flag.model.ts`                       | `FlagModel`                 |
| Mapper               | `flag.mapper.ts`                      | `class FlagMapper`          |
| Use-case             | `toggle-flag/toggle-flag.use-case.ts` | `class ToggleFlagUseCase`   |
| Decorator            | `with-auth.ts`                        | `withAuth`                  |

Interfaces carry an `I` prefix only for repositories, where interface and implementation would
otherwise collide by name. Don't `I`-prefix everything.

---

## 12. Adding a feature, end to end

Inside-out, and each step is verifiable before the next exists:

1. **Model it in `core`** — entity and/or value objects in the relevant feature folder, invariants
   in constructors.
2. **Declare the persistence you need** — add methods to the repository interface in that same
   folder. Declare only what the use-case will call.
3. **Write the use-case** — a new folder under `core/use-cases/<action>/`, taking the interfaces
   from step 2 via constructor.
4. **Test it with fakes** — in-memory repositories, no DB, no HTTP. If this is hard, the design is
   wrong. Fix it here, not later.
5. **Implement infrastructure** — model, mapper, concrete repository in the mirrored folder.
6. **Wire it in `composition`.**
7. **Expose it** — a thin route wrapped in `withAppHandlers`.

Steps 1–4 involve zero frameworks and hold all the actual thinking. If most of the time goes into
5–7, the feature was probably shaped wrong.

---

## 13. Open structural questions

**Resolved so far:**

- **ID generation — DECIDED.** Entities carry a domain-generated string `id` from the
  `IIdGenerator` port (`crypto.randomUUID` in infrastructure), and Mongo stores it as the document
  `_id`. No `ObjectId` anywhere; `core` never learns Mongo exists.
- **Error handling — DECIDED (mapping pending).** `core` throws typed `DomainError`s
  (`ValidationError` / `NotFoundError` / `ConflictError` / `ForbiddenError`), each with a `code`.
  What's left is the delivery-layer table that maps `code` → HTTP status — built when routes are.

**Still open:**

**Transactions — now v1-blocking.** Team management landing in v1 changed this from "not urgent."
`CreateOrganizationUseCase` writes an `Organization` _and_ its owner `Member`; `AcceptInvitationUseCase`
writes a `Member` and updates the `Invitation`. Both are multi-document writes that must not
half-succeed. Handing a Mongo session to a use-case without leaking Mongoose into `core` needs a
Unit-of-Work-style port. This is the first thing to resolve when the use-case layer starts.

**Input validation placement.** Entities guard invariants, but something must reject a malformed
JSON body before it reaches a constructor. Zod at the route boundary is the natural fit — but Zod
cannot live in `core`, so the schema and the entity invariant risk stating the same rule twice.
Worth deciding how much duplication is acceptable.

**Entities or DTOs on the wire?** The §6 example shows a `FlagPresenter`, but this is not yet
settled. Serializing entities directly couples the public API to the domain model — renaming an
entity field silently breaks the dashboard (and, in v2, the SDK). Recommend routes map entity → DTO
from `packages/contracts`, but it needs an explicit decision.
