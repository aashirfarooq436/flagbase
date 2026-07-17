# CLAUDE.md — working rules for this repository

FlagBase — a feature-flag platform built as a Clean Architecture exercise. This file is the
operational contract for working in this repo: the laws, conventions, and workflow. It overrides
default behavior. Read it before writing code.

**The project's primary goal is learning strict Clean Architecture — architectural correctness
outranks shipping speed.** When a choice trades correctness for convenience, choose correctness or
raise it; don't quietly take the shortcut.

Design rationale lives in `docs/`, not here:

- `docs/DOMAIN_MODEL.md` — entities, value objects, ports, invariants (the authority on the model)
- `docs/BACKEND_ARCHITECTURE.md` — layers, import rules, request lifecycle (the authority on the backend)
- `docs/SYSTEM_DESIGN.md` — full-stack + monorepo shape
- `docs/PROJECT_BRIEF.md` — historical origin doc (banner-marked; superseded in places)

---

## 1. The Prime Directive — `core` is pure

`packages/core` imports **nothing** — no Mongoose, no CASL, no Next.js, no React, no npm dependency,
no runtime global (`process`, `window`, `crypto`, `setTimeout`, `Buffer`). Its `package.json` has an
empty `dependencies` block and its `tsconfig` sets `lib: ["ES2022"], types: []` so violations fail
to compile, not review.

If you ever want to add a dependency to `core`, the design is wrong — not the rule. Move the concern
to a **port** (an interface `core` declares) implemented in `infrastructure`.

This is the whole point of the project. Guard it fiercely. Anything environmental that varies by
runtime (ids, time, hashing, email) is injected via a port; anything that must be byte-identical
everywhere forever (rollout bucketing) is pure math inside `core`.

---

## 2. Dependencies point inward

| Package             | May import                                     | Must NEVER import                         |
| ------------------- | ---------------------------------------------- | ----------------------------------------- |
| `core`              | nothing (not even other workspace packages)    | Mongoose, CASL, Next, any npm dep         |
| `infrastructure`    | `core`, Mongoose, external-service SDKs        | `composition`, `apps/*`                   |
| `composition` [tbd] | `core`, `infrastructure`                       | `apps/*`                                  |
| `apps/*` [tbd]      | `core`, `composition`, Next, CASL              | `infrastructure` **directly**             |

Apps reach infrastructure only through the composition root. No route handler ever `new`s a
repository. `composition` is the single place concrete classes are constructed.

`infrastructure` vs `lib` test: **does it reach outside the process?** DB/HTTP/email → infrastructure.
In-memory orchestration/decisions (CASL, decorators, wiring) → `lib`.

---

## 3. Directory structure

```
packages/core/src/
├── shared/           kernel — Entity base, Email, errors, ports (pure domain building-blocks)
├── domain/<feature>/ entity + value objects + repository INTERFACE  (user, organization,
│                     member, invitation, project, flag)
└── use-cases/<action>/   [not built] one folder per action, NOT nested under an entity

packages/infrastructure/src/
├── lib/              technical plumbing (lib/mongoose/{connection,mongo-errors}, lib/test-support/)
└── persistence/<feature>/   Mongo model + mapper + repository IMPLEMENTATION (mirrors core/domain 1:1)
```

Rules:

- **Entities/value objects/repo interfaces go in feature folders. Use-cases do not** — they
  orchestrate across features and have no single owner (`InviteMemberUseCase` touches Organization +
  Member + User). One folder per use-case, named by the action.
- `invitation/` is its own feature folder, not under `member/` — it's a distinct aggregate.
- Infrastructure's persistence layer is `persistence/`, **not** `domain/` — the domain lives in
  `core`; this layer only persists it. Non-DB adapters (email, webhooks) go in `lib/` or their own
  top-level folder, never under `persistence/`.

---

## 4. Coding conventions

- **OOP throughout the backend.** Entities, value objects, use-cases, repositories are classes.
- **SOLID, concretely:** one use-case = one operation (SRP); new targeting-rule types implement the
  `TargetingRule` interface rather than adding `if` branches (OCP); repository interfaces stay narrow
  (ISP); use-cases receive repository **interfaces** via constructor, never construct their own deps (DIP).
- **Value objects** are immutable, validated in the constructor, compared by value (`equals`). An
  invalid instance must be impossible to construct (e.g. `RolloutPercentage(150)` throws).
- **Entities** extend `Entity` (identity + `equals`). Expose a static `create()` factory for new
  instances (stamps `createdAt`, applies defaults); the `constructor(props)` is the full-fidelity
  path the persistence mapper uses to rehydrate.
- **Mutating methods take `now: Date`** (`flag.enable(now)`) rather than reading a clock — keeps
  entities pure; the `IClock` port lives at the use-case layer.
- **Errors:** `core` throws typed `DomainError`s — `ValidationError`, `NotFoundError`,
  `ConflictError`, `ForbiddenError` — each with a `code`. Never throw a bare `Error` for a domain
  failure. The delivery layer maps `code` → HTTP status.
- **Cross-row invariants** (unique email, exactly-one-owner) cannot live on an entity — they go in
  the use-case, backstopped by a DB unique index that translates a collision into a `ConflictError`.
- **Naming:** `flag.entity.ts` → `class Flag`; `rollout-percentage.vo.ts` → `class RolloutPercentage`;
  `flag.repository.ts` → `interface IFlagRepository`; `mongo-flag.repository.ts` → `class
  MongoFlagRepository`; `flag.model.ts` → `FlagModel`; `flag.mapper.ts` → `class FlagMapper`.
  `I`-prefix is **only** for repository interfaces (where impl and interface collide by name).
- Each entity file opens with a comment block listing its persisted field shape.
- The persistence mapper is the ONLY place that knows both the document and the entity shape.
  Denormalized fields (read-perf duplicates) exist only in the document/mapper, never on the entity.
- Store the domain-generated UUID as Mongo `_id` (`type: String`). No `ObjectId` anywhere.

---

## 5. Testing

- **Runner:** Vitest.
- **`core` — pure unit tests, zero infrastructure.** Construct with in-memory fakes; assert business
  outcomes. If testing a use-case needs a DB or a `NextRequest`, something leaked — fix the design.
- **`infrastructure` — integration tests against a real in-process MongoDB** (`mongodb-memory-server`,
  via `useMongoTestEnv()` in `lib/test-support/`). Test the mapper round-trip by **behavior**
  (reload → `evaluate()` gives the same answers), not just field equality.
- Repository **interfaces** get no tests (they're type-only). Repository **implementations** get
  integration tests. When in-memory fakes exist, add a shared contract test asserting they behave
  identically to the Mongo ones.
- `bucketing` and `Flag.evaluate` carry the heaviest coverage — they're the load-bearing logic.
  Bucketing has a canary/snapshot test; if it fails, the hash changed and every user re-buckets.
- Always run tests and `check-types` after a change; report failures honestly with output.

---

## 6. Tooling & commands

- **Package manager: pnpm** (via corepack, pinned in root `package.json`). Do not use npm/yarn here.
- **Monorepo: Turborepo + pnpm workspaces.** Use official generators for scaffolding; leave their
  defaults alone; don't hand-write config a generator provides.
- Native/postinstall builds (esbuild, argon2, mongodb-memory-server) are allow-listed in
  `pnpm-workspace.yaml` (`allowBuilds:`) — pnpm blocks them by default.

```
pnpm install                                  # bootstrap
pnpm test                                      # all packages via turbo
pnpm check-types                               # all packages
pnpm --filter @flagbase/core test              # one package
pnpm --filter @flagbase/infrastructure check-types
```

Chosen tech: MongoDB/Mongoose (repos swappable later — `core` never imports it), argon2 (passwords),
Node `crypto` SHA-256 (tokens/keys), CASL (RBAC, delivery layer only).

---

## 7. v1 scope guardrails — do NOT reintroduce deferred work

v1 is the **control plane only** (backend + dashboard) and is a **learning milestone, not a
release**. These are **v2** — do not build or model them into v1 unless asked:

- The npm **SDK** and the `/api/sdk/.../rules` endpoint and `Project.apiKeyHash`
- The **platform-admin app** and the `PlatformAdmin` entity
- Multi-environment, multivariate flag values, audit log, attribute-based targeting

**Auth is email + password only.** OAuth/Google and email verification were **removed**. If you see
`OAuthAccount`, account linking, or `emailVerifiedAt` in an old doc, do NOT reintroduce them — the
docs lag the code. Every user has a required `passwordHash`.

Design `core` as though the SDK is coming (keep it framework-agnostic), even though it isn't built —
the empty-`dependencies` rule is the only thing enforcing that now.

---

## 8. Decisions still open — don't silently pick one

- **Transactions / Unit-of-Work (v1-blocking).** `CreateOrganizationUseCase` and
  `AcceptInvitationUseCase` each write two documents that must not half-succeed. Needs a UoW-style
  port that doesn't leak Mongoose into `core`. Resolve before those use-cases.
- **Input validation placement** (Zod at the route boundary vs. entity constructors — avoid stating
  the same rule twice).
- **Entities vs DTOs on the wire** (recommend routes map entity → DTO; not yet decided).

When work hits one of these, surface it and get a decision — don't invent an answer.

---

## 9. Git & workflow

- **Commit to `develop`, never `main`.** Branch from `develop`. Don't commit or push unless asked.
- Local git identity is set for this repo (`Aashir Farooq <aashirfarooq436@gmail.com>`); don't touch
  global config.
- GitHub repos are created via the web UI, not `gh`.
- **Aashir validates; the agent implements the domain/application code.** Explain *why* alongside
  *what*. When a decision is questioned, give the honest tradeoff including the case against — not a
  defense of the current approach. Ask before large scope or structural changes.
