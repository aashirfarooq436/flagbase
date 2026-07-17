# FlagBase — System Design

Companion to `PROJECT_BRIEF.md`. This document locks in the concrete structure: repo layout,
class shapes, the API decorator chain, the frontend API client, and the SDK.

**The one invariant everything else is built around:** `core/` is pure. It imports nothing
from outside itself — no Mongoose, no CASL, no React, no Next.js, no Node built-ins tied to a
runtime. Every other layer exists to either implement something `core/` declared an interface
for, or to orchestrate `core/` for a specific delivery context. When in doubt about where a new
piece of code goes, the test is: does this need to import a third-party package or framework
API? If yes, it cannot go in `core/`.

---

## 0. Scope: what v1 actually is

**v1 is a learning milestone, not a release.** It is the control plane only:

| In v1                                      | Deferred to v2                             |
| ------------------------------------------ | ------------------------------------------ |
| `packages/core`                            | `packages/sdk` (§7)                        |
| `packages/infrastructure`                  | `apps/admin` + `PlatformAdmin` (§9)        |
| `packages/composition`                     | `Project.apiKeyHash` + `/api/sdk/rules`    |
| `apps/dashboard` — auth, orgs, team, flags | Multi-environment, multivariate, audit log |

Nothing consumes flags at runtime in v1. Evaluation is exercised only by the dashboard's "test
this rule" preview. That's deliberate: build the control plane correctly, then add the data plane.

**Design as though the SDK is coming anyway.** It was the original structural proof of `core`'s
purity — if `core` imported Mongoose, the SDK build broke immediately. With it deferred, that
enforcement moves to the package boundary: `packages/core/package.json` carries an empty
`dependencies` block, so `import mongoose` inside an entity fails to resolve at build time. The
witness is gone; the mechanism isn't. Every §7 and §9 decision below stays documented because
adding them in v2 must be _additive_ — a new package and new use-cases, not a restructuring.

Sections marked **[v2]** are designed but not being built yet.

---

## 1. Repo structure (Turborepo monorepo)

```
flagbase/
├── apps/
│   ├── dashboard/                    — Next.js app, CUSTOMER-facing control plane
│   │   ├── app/
│   │   │   ├── api/                  — route.ts handlers, wrapped in withAppHandlers
│   │   │   └── (routes)/             — pages/components
│   │   └── lib/
│   │       ├── decorators/           — withDb (shared), withAuth, withAbility, withAppHandlers
│   │       ├── casl/                 — buildAbilityFor() — domain Role -> CASL Ability
│   │       ├── api-client/           — ApiClient + service classes (§6)
│   │       └── hooks/                — useApiService, useFlags, useOrg, ...
│   └── admin/                        — [v2] Next.js app, PLATFORM-facing (Aashir + future
│       │                                support staff). Separate deploy/subdomain.
│       ├── app/
│       │   ├── api/                  — route.ts handlers, wrapped in withAdminAppHandlers
│       │   └── (routes)/
│       └── lib/
│           ├── decorators/           — withDb (shared), withAdminAuth, withAdminAbility
│           ├── casl/                 — buildAbilityFor() for PlatformAdmin, not User
│           ├── api-client/
│           └── hooks/
├── packages/
│   ├── core/                         — PURE. Entities, VOs, use-cases, repo interfaces,
│   │                                    Role/Permission concept. No imports from outside core/.
│   ├── infrastructure/               — gateways to the outside world. Mongoose models,
│   │                                    mappers, repo implementations now; email/webhook/
│   │                                    storage adapters later. Depends on core. Never
│   │                                    imported by sdk.
│   ├── composition/                  — shared composition root (§4). One consumer in v1
│   │                                    (dashboard); shared with admin in v2.
│   ├── sdk/                          — [v2] published npm package. Depends ONLY on core.
│   └── contracts/                    — shared DTO/request-response types used by the API
│                                        routes (both apps) and their respective ApiClients.
├── turbo.json
└── package.json                      — workspaces: ["apps/*", "packages/*"]
```

The dividing line between `infrastructure/` and `lib/`: **infrastructure reaches outside the
process** (DB, third-party APIs, external services). **lib orchestrates or decides**, in-memory,
using things `core/` and `infrastructure/` provide — decorators compose handlers, CASL computes
a permission decision, the composition root wires objects together, hooks manage client state.
Nothing in `lib/` makes a network/DB call directly; it calls into `infrastructure/` or `core/`
for that.

---

## 2. Domain layer (`packages/core`) — OOP, SOLID

Everything here is a class. No imports from outside `core/`, ever — including CASL.

**Two organizing principles, not one** — feature folders for entities/repos (things that
genuinely belong to a single concept), a separate use-case namespace organized by action (things
that orchestrate across concepts). A use-case is never nested inside an entity's folder, even
when it mostly concerns one entity, because some use-cases (`InviteMemberUseCase`) legitimately
need `Organization`, `Member`, and `User` all at once — there's no non-arbitrary "owner" to pick.

```
core/src/
├── shared/                        — kernel: Entity base, Email, errors, ports
├── domain/
│   ├── user/                      User { id, email, name, passwordHash }
│   ├── organization/              Organization { id, name }  — no ownerId
│   ├── member/                    Member { id, organizationId, userId, role }, Role
│   ├── invitation/               Invitation + InvitationStatus
│   ├── project/                   Project { id, organizationId, name }
│   └── flag/                      Flag, FlagKey, RolloutPercentage, TargetingRule, bucketing
└── use-cases/                     — [not built yet] by ACTION, one folder each
```

> **`DOMAIN_MODEL.md` is the authority** for entity fields, invariants, and value objects. This
> is a locator only — auth is email + password (no OAuth); `invitation/` is its own feature
> folder. The `core`/`infrastructure` layers are built and tested; `use-cases/` and the apps
> are not.

**SOLID in practice here:**

- **SRP** — one use-case class per business operation (`ToggleFlagUseCase` doesn't also validate
  targeting rules; that's `UpdateFlagRulesUseCase`'s job).
- **OCP** — new targeting rule types extend a `TargetingRule` base/interface rather than adding
  branches to `EvaluateFlagUseCase`.
- **LSP** — any `IFlagRepository` implementation (Mongo now, Postgres later) must be swappable
  without changing use-case behavior.
- **ISP** — narrow repository interfaces (`IFlagRepository` doesn't force `IOrganizationRepository`'s
  methods onto an implementer).
- **DIP** — use-cases depend on repository _interfaces_, constructed and injected from outside
  (the composition root, §4), never instantiating a concrete repo themselves.

### 2.3 Role/Permission — where the CASL boundary sits

`core/domain/member/role.vo.ts` defines what roles _mean_, as plain data — no CASL import:

```typescript
enum Role { Owner = "owner", Admin = "admin", Member = "member" }

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Owner]:  ["organization:manage", "project:manage", "flag:manage", "member:manage"],
  [Role.Admin]:  ["project:manage", "flag:manage", "member:read"],
  [Role.Member]: ["project:read", "flag:read"],
};
```

`lib/casl/build-ability.ts` reads `ROLE_PERMISSIONS` and translates it into a real CASL
`AppAbility` for a given user + organization. This is the only place `@casl/ability` gets imported —
`core/` stays ignorant that CASL exists.

---

## 3. Infrastructure layer (`packages/infrastructure`)

Mirrors `core/`'s feature folders 1:1 (it has no use-cases of its own, so no use-case mirror is
needed) — given `core/flag/flag.repository.ts` declares the interface, the implementation sits
exactly where you'd look for it:

```
infrastructure/src/
├── mongoose/connection.ts          ensureConnection(uri) — cached, serverless-safe
├── shared/mongo-errors.ts          maps Mongo code 11000 → domain ConflictError
├── test-support/mongo-test-env.ts  in-process MongoDB for integration tests
└── domain/                         mirrors core/domain 1:1 — per feature:
    <feature>/
      <feature>.model.ts            Mongoose schema (domain UUID stored as _id)
      <feature>.mapper.ts           document ↔ entity translation
      mongo-<feature>.repository.ts implements core's I<Feature>Repository
```

> **`BACKEND_ARCHITECTURE.md` §4 is the authority** here. All six repositories are built and
> integration-tested (`mongodb-memory-server`). Any denormalized fields (e.g. an organization
> name copied onto a `Member` document for read speed) live ONLY in the mapper — `core` never
> sees them.

Future external-system adapters (email, webhooks, cloud storage) join this package the same
way: a concrete class implementing an interface `core/` declared, translating to/from whatever
that external system's API looks like. If a given adapter doesn't map onto one of the existing
feature folders (e.g. an `EmailSender` isn't tied to a single entity), give it its own top-level
folder (`infrastructure/email/`) rather than forcing it into an unrelated one.

---

## 4. Composition root (`packages/composition`)

The only place concrete infrastructure classes get `new`'d up and wired into use-cases.

It's a **shared package** rather than something inside `apps/dashboard`, even though the dashboard
is its only consumer in v1. When `apps/admin` arrives in v2 it wires to the exact same
repositories, and duplicating this per app would leave two places that could drift on how a
`MongoFlagRepository` gets constructed. Keeping it separate now costs one folder; retrofitting it
later means touching every route.

```typescript
// packages/composition/composition-root.ts  — [not built yet]
class CompositionRoot {
  private organizationRepository = new MongoOrganizationRepository();
  private flagRepository = new MongoFlagRepository();
  // ...

  // customer-facing use-cases
  createFlagUseCase = new CreateFlagUseCase(
    this.flagRepository,
    this.organizationRepository,
  );
  toggleFlagUseCase = new ToggleFlagUseCase(this.flagRepository);
  evaluateFlagUseCase = new EvaluateFlagUseCase();

  // [v2] platform-admin use-cases (§9) — same repos, different application rules
  // listOrganizationsUseCase = new ListOrganizationsUseCase(this.organizationRepository);
}

export const composition = new CompositionRoot();
```

Each app imports `composition` and only ever touches the use-cases relevant to it. Route handlers
import ready-made use-case instances — never constructing a repository or use-case themselves.
This is what keeps use-cases trivially unit-testable in isolation: tests construct their own
`new CreateFlagUseCase(new InMemoryFlagRepository(), ...)`, bypassing this file entirely.

**[v2]** The SDK will need its own equivalent for its own runtime — wiring `EvaluateFlagUseCase`
to a polling-based repository instead of Mongo (§7). That one lives inside `packages/sdk`, since
it wires a repository implementation (`PollingFlagRepository`) only the SDK uses.

---

## 5. API delivery layer — the decorator chain (`apps/dashboard/lib/decorators`)

Each is a higher-order function: `(handler) => handler'`. Next.js App Router route handlers are
plain exported functions, so this composes via function-wrapping rather than TS class
decorators — same intent (cross-cutting concerns layered around a core action), the idiomatic
mechanism for this framework.

```typescript
// withDb.ts
function withDb(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    await ensureMongooseConnection();
    return handler(req, ctx);
  };
}

// withAuth.ts
function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const user = await resolveUserFromSession(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return handler(req, { ...ctx, user });
  };
}

// withAbility.ts
function withAbility(action: string, subject: string) {
  return (handler: RouteHandler): RouteHandler =>
    async (req, ctx) => {
      const ability = buildAbilityFor(ctx.user, ctx.org); // lib/casl — domain Role -> CASL Ability
      if (ability.cannot(action, subject)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return handler(req, { ...ctx, ability });
    };
}

// withAppHandlers.ts — the one route authors actually reach for
function withAppHandlers(
  handler: RouteHandler,
  opts: { action: string; subject: string },
): RouteHandler {
  return withDb(withAuth(withAbility(opts.action, opts.subject)(handler)));
}
```

Route file stays thin — parse input, call the use-case via `composition`, map result to HTTP:

```typescript
// app/api/projects/[projectId]/flags/[flagId]/toggle/route.ts
export const PATCH = withAppHandlers(
  async (req, ctx) => {
    const flag = await composition.toggleFlagUseCase.execute({
      flagId: ctx.params.flagId,
    });
    return NextResponse.json(flag);
  },
  { action: "manage", subject: "Flag" },
);
```

No business logic in `route.ts` — this is the violation brief §6.5.3 calls out as the most
common Clean Architecture failure in a Next.js repo, and the decorator chain keeps it out
structurally rather than by discipline alone.

---

## 6. Frontend API client (`apps/dashboard/lib/api-client`, `lib/hooks`)

```
lib/
├── api-client/
│   ├── base-api-service.ts     class BaseApiService { protected get/post/patch/delete(path, body) }
│   ├── users.api-service.ts    class UsersApiService extends BaseApiService { update(id, dto) { return this.patch(`/users/${id}`, dto) } }
│   ├── flags.api-service.ts    class FlagsApiService extends BaseApiService { toggle(id) {...}; updateRules(id, dto) {...} }
│   ├── orgs.api-service.ts
│   ├── api-client.ts           class ApiClient { users = new UsersApiService(); flags = new FlagsApiService(); ... }
│   └── api-service-context.tsx ApiServiceProvider — provides the ApiClient instance via context
└── hooks/
    ├── use-api-service.ts      useApiService() — reads the ApiClient out of context
    ├── use-flags.ts            useFlags(projectId) — read hook, built on useApiService + SWR
    └── use-org.ts
```

Usage in components: `const apiClient = useApiService(); await apiClient.flags.toggle(flagId);`

Request/response shapes come from `packages/contracts`, shared with the API route handlers, so
a DTO change surfaces as a type error on both ends instead of a runtime mismatch.

**Data-fetching on top of the client:** recommend **SWR** for read hooks — cache + revalidation
for free, fetcher is just `() => apiClient.flags.list(projectId)`. Mutations call the client
directly, then `mutate()` the relevant SWR key. Flag if you'd rather hand-roll hooks with
`useState`/`useEffect` instead — SWR is the default here, not yet confirmed.

---

## 7. SDK package (`packages/sdk`) — [v2]

> **Deferred.** Not built in v1 (§0). Documented because `core` must stay shaped so this drops in
> as a new package rather than a restructuring — that constraint is the reason `core` stays pure.

```typescript
class FlagBaseClient {
  private cache: FlagRuleSet | null = null;
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private apiKey: string,
    private options: { pollIntervalMs?: number } = {},
  ) {}

  async initialize(): Promise<void> {
    this.cache = await this.fetchRules();
    this.pollHandle = setInterval(
      () => this.refresh(),
      this.options.pollIntervalMs ?? 30_000,
    );
  }

  isFeatureEnabled(flagKey: string, userContext: UserContext): boolean {
    const flag = this.cache?.getFlag(flagKey);
    if (!flag) return false; // fail closed if rules haven't loaded / flag doesn't exist
    return evaluateFlagUseCase.execute({ flag, userContext }); // from packages/core, pure
  }
}
```

Notes:

- `evaluateFlagUseCase` is the _same class_ from `core/use-cases/evaluate-flag/evaluate-flag.use-case.ts`
  — re-exported, not reimplemented. This is the provable decoupling test from brief §5.2.
- Polling via `setInterval` works for long-lived Node/browser runtimes. **Edge/serverless
  functions are short-lived** — `initialize()` there should do a one-shot fetch per invocation,
  possibly with a short TTL cache at module scope. Deferred design pass until the edge target is
  actually being built.
- Auth: the SDK's `apiKey` maps to a `Project` (brief §5.1) — the dashboard's API validates it
  and scopes the rules response to that project only.

---

## 8. Data flow summary

**Write path (dashboard):** browser → `apiClient.flags.updateRules()` → `PATCH /api/.../flags/:id`
→ `withDb → withAuth → withAbility('manage','Flag')` → route handler → `composition.updateFlagRulesUseCase.execute()`
→ `MongoFlagRepository.save()` → Mongoose → MongoDB.

**Read path (SDK, in a customer's runtime):** `FlagBaseClient.initialize()` → `GET /api/sdk/projects/:id/rules`
(authenticated via project API key, not user session — separate, lighter check than
`withAuth`/CASL, since there's no logged-in user here) → cached in-memory → `isFeatureEnabled()`
calls `EvaluateFlagUseCase` locally, no network round-trip per evaluation.

---

## 9. Platform Admin app (`apps/admin`) — [v2]

> **Deferred.** Not built in v1 (§0). Until it exists, support/debugging happens by querying Mongo
> directly. The `PlatformAdmin` entity and its use-cases are deferred with it.

A second, separate deliverable alongside the customer dashboard: `apps/admin`, used by Aashir
(and, later, support staff) to operate the platform itself — not a tenant's account. This is
**not** modeled as a special case of `Organization`/`Member`/`Role` (§2), because a platform
admin's authority isn't derived from membership in any tenant; it operates _across_ tenants.
Bolting it onto the existing role system would mean either a fake `Organization` membership for the
admin, or leaky `if (user.isSuperAdmin)` checks scattered through tenant-scoped logic — the same
anti-pattern the brief flagged for persistence-layer leakage, at the auth layer instead.

### 9.1 Domain: a new `core/domain/platform-admin/` feature folder

```
core/domain/platform-admin/
├── platform-admin.entity.ts     class PlatformAdmin { id, email, role: PlatformRole }
├── platform-admin.repository.ts interface IPlatformAdminRepository
└── platform-role.vo.ts          enum PlatformRole { SuperAdmin, Support } + permission table,
                                   same shape as core/domain/member/role.vo.ts but a completely
                                   separate vocabulary — PlatformRole permissions are about
                                   cross-tenant platform operations (`organization:list`,
                                   `organization:read`, later `organization:suspend`).
```

`Support` is included now even though v1 admin is a single operator (you), per the "plan for a
small admin team later" decision — adding a second `PlatformAdmin` row with role `Support` later
is a data change, not a redesign.

### 9.2 Use-cases — read-only in v1, living in the same `core/use-cases/` namespace

```
use-cases/
├── list-organizations/         ListOrganizationsUseCase — unscoped, unlike the dashboard
├── get-organization-details/   GetOrganizationDetailsUseCase — organization + its projects
└── list-project-flags/         ListProjectFlagsUseCase — read-only flag visibility for support
```

These reuse the exact same `IOrganizationRepository`/`IProjectRepository`/`IFlagRepository`
interfaces the dashboard's use-cases use — no new repository interfaces needed for the read-only
scope. This is a third proof point for `core/`'s decoupling (after the dashboard and the SDK): a
third consumer, with a third set of application rules, over the same domain model. Mutating admin
actions (e.g. `SuspendOrganizationUseCase`) are deferred until the scope expands past read-only.

### 9.3 Infrastructure

`infrastructure/platform-admin/` mirrors the pattern from §3: Mongo model, mapper, and
`MongoPlatformAdminRepository implements IPlatformAdminRepository`.

### 9.4 Delivery — separate auth, separate decorators, shared `withDb`

`apps/admin` has its own `withAdminAuth` (resolves a `PlatformAdmin`, not a `User` — a
completely separate login, not reachable from the customer signup/login surface at all) and its
own `withAdminAbility` (builds a CASL ability from `PlatformRole`, not `Role`). `withDb` is
identical in both apps (just ensures a Mongoose connection) and can be shared as-is — worth
lifting into a small shared package (or `packages/composition`, since it's already shared
infrastructure glue) if the duplication starts to bother you; not urgent at two apps.

Recommend deploying `apps/admin` on its own subdomain (e.g. `admin.flagbase.app`) so it's never
one accidental route away from customer-facing surface area.

---

## 10. Still open

- SWR vs plain hooks for the frontend data layer (default: SWR, not yet confirmed).
- Exact CASL action/subject vocabulary beyond `manage`/`read` (e.g. does `Admin` get
  `member:invite` distinct from `member:manage`?).
- Edge-runtime SDK caching strategy — deferred until the edge target is actually being built.
- Project API-key format and where it's validated (separate from user-session `withAuth`).
- **[v2]** How `PlatformAdmin` accounts get created/authenticated — manual DB seed vs. a minimal
  invite flow; not urgent while it's a single operator.
- **[v2]** Whether/when admin mutation (`organization:suspend` etc.) gets added, and what
  audit-trail expectations come with it.
- **v1-blocking:** multi-document transactions (a Unit-of-Work port) — `CreateOrganizationUseCase`
  and `AcceptInvitationUseCase` each write two documents that must not half-succeed.
