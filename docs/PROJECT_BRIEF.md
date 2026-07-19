# Project Brief

> **Status — historical origin document (as of 2026-07-17).** This captures the _original_
> thinking and business rationale, which still hold. Several specifics have since been superseded;
> where this doc and the others disagree, the others win:
>
> - **v1 scope narrowed.** v1 is control-plane only (backend + dashboard) and is a _learning
>   milestone, not a release_. The npm SDK, the platform-admin app, and multi-environment/
>   multivariate/audit are all **v2**. (This brief's §4.1 still calls the SDK first-class-in-v1 —
>   no longer true.) See `SYSTEM_DESIGN.md` §0.
> - **Auth simplified.** Email + password only. No Google/OAuth, no email verification.
> - **Naming.** The tenant entity is `Organization` (not `Org`).
> - **Live docs:** `SYSTEM_DESIGN.md` (full-stack + monorepo), `BACKEND_ARCHITECTURE.md` (backend
>   layers/rules), `DOMAIN_MODEL.md` (entities, invariants). Those reflect the built code.

## 1. Purpose of this document

This is a context-transfer document for a solo side project. Paste this into a new Claude
conversation (or drop it into a Claude Project's knowledge base) to bring that session up to
speed with zero prior context. It captures the business problem, the product decision, the
domain model, and the architectural approach agreed on so far — including the reasoning, not
just the conclusions, so a new session can extend the thinking rather than just follow it.

---

## 2. Who is building this, and why

Aashir Farooq — Computer Engineer (COMSATS Lahore, July 2024), ~2 years experience,
full-stack JavaScript developer (NestJS/Express backend, Next.js frontend) currently working
at a startup. Goal for this project is dual, and deliberately ordered:

1. **Primary goal — learning:** deliberately practice Clean Architecture (Uncle Bob-style) in
   a real, non-trivial codebase, to the point of strict discipline — a framework-agnostic
   domain/use-case core, fully decoupled from Next.js, MongoDB/Mongoose, Vercel, or any other
   external technology. This is the main reason the project exists. Architectural correctness
   takes priority over shipping speed.
2. **Secondary goal — monetization:** build something with real monetization potential, not a
   toy — a dev-tool aimed at other developers/small teams, since that's a market Aashir already
   understands as a practitioner. The learning goal comes first; monetization is the reason the
   thing being learned-on is a real product rather than a throwaway exercise.

This followed a broader discussion about how AI-assisted coding shifts an engineer's value
away from framework syntax and toward architecture, system design, data modeling, and
judgment about tradeoffs — skills AI doesn't reliably substitute for yet. This project is a
deliberate vehicle for building that judgment through practice, not just reading about it.

---

## 3. The business problem

### 3.1 What a feature flag is

A feature flag is a runtime switch that decouples **deploying code** from **releasing a
feature to users**. Instead of code going live for 100% of users the moment it's deployed, it's
wrapped in a check:

```typescript
if (isFeatureEnabled('dark-mode', currentUser)) {
  return <DarkModeUI />;
}
return <NormalUI />;
```

The feature ships dark (off) by default. A separate system controls who sees it and when.

### 3.2 Why this is a real problem worth solving (not just "nice to have")

Staging/preview environments answer "does this code work." They do **not** answer:

- **"How does this behave under real production traffic and real data?"** Staging traffic is
  synthetic. Bugs and edge cases often only appear at real scale, with real user data
  distributions. Flags let a team expose a change to e.g. 5% of real production users, watch
  real metrics, and only then widen the rollout — de-risking releases without needing a full
  rollback/redeploy cycle if something's wrong.
- **"How do we react instantly when something in production breaks?"** A flag wrapping a
  risky integration turns an emergency hotfix (branch → review → build → deploy → hope) into
  flipping a switch — seconds, not an incident response process.
- **"How do we show different features to different customer segments without hardcoding
  it?"** E.g., "only Enterprise-plan customers see the analytics dashboard." Doing this via
  scattered `if (user.plan === 'pro')` checks throughout a codebase becomes unmanageable;
  centralizing it as a flag/rule is more maintainable and auditable.

**The mental model:** staging tests whether code _works_. Feature flags control who
_experiences_ code that's already confirmed to work, and how much blast radius a mistake has
if the team is wrong. Different axis entirely.

### 3.3 Target buyer

Small-to-mid dev teams and indie SaaS builders who've outgrown "just deploy and watch" (real
paying users, a bad release actually costs something) but for whom LaunchDarkly-style
enterprise pricing is disproportionate. The wedge is: LaunchDarkly is widely regarded as
excellent but expensive at small scale — "cheap, good-enough flags for indie/small teams" is
a legitimate underserved niche.

### 3.4 Explicitly out of scope for MVP reasoning

This is a build-to-learn project first, revenue-validated product second. Don't over-index on
competitive moat or growth strategy in early sessions — the immediate goal is a working,
architecturally sound MVP.

---

## 4. What's actually being built: two deliverables, one architecture

This is not just a dashboard with an API. It is a **two-part product**:

1. **An npm package (the SDK)** — installed by a customer into _their own_ repo
   (`npm install <sdk-name>`). It runs inside the customer's own server/edge/client runtime,
   evaluates flags locally against rules it has fetched/cached, and reports evaluation
   context back. This is the thing that actually gets embedded in other people's codebases —
   it must be small, dependency-light, and framework-agnostic on its own terms (it must not
   assume Next.js, Express, or any particular customer stack).
2. **A web application (the dashboard)** — a Next.js full-stack app, hosted on Vercel, that
   the customer logs into to create flags, define targeting rules, toggle rollouts, and see
   which of their installed SDK instances are checking in. The dashboard is the control plane;
   the installed SDK is the data plane that enforces those controls inside the customer's app.

The dashboard and the SDK are two different deployables with two different runtime
environments, but they must agree on the same core domain logic (entities, evaluation rules)
so that behavior is consistent and predictable between "what the dashboard says the flag
should do" and "what the SDK actually does when it evaluates that flag." Clean Architecture is
the mechanism that makes sharing that logic safe: if the evaluation engine and domain
entities live in a framework-agnostic `core/`, that same `core/` can be depended on by both the
Next.js dashboard app and the standalone npm package, without either dragging in the other's
runtime assumptions.

### 4.1 v1 (MVP) feature set

- Boolean flags only (on/off) — no multivariate (string/number/JSON) values yet.
- Single environment to start (no dev/staging/prod separation in v1 — add later).
- Targeting: by explicit user ID list, and/or percentage rollout.
- A minimal dashboard: create a flag, toggle it, edit targeting rules.
- A real npm package (not just documented fetch calls) that customer apps install and use to
  evaluate a flag for a given user context — this is a first-class v1 deliverable, not a
  stretch goal.
- No audit log, no multivariate flags, no multi-environment in v1.

### 4.2 v2+ (explicitly deferred)

- Multiple environments per project (dev/staging/prod), where the flag _definition_ is
  shared but its _rules/values_ differ per environment.
- Multivariate flag values (string/number/JSON, not just boolean).
- Full audit log of evaluations and rule changes.
- More advanced targeting (attribute-based rules beyond simple userId/percentage — e.g.
  `user.plan == 'pro' AND user.region == 'EU'`).
- Multiple language SDKs (v1 is JS/TS only).
- Agentic AI features (e.g. an assistant that suggests rollout strategy, flags anomalies in
  evaluation patterns, or auto-drafts targeting rules from a plain-language description).
  Deliberately deferred, but a motivating reason the domain core must stay framework-agnostic
  now — bolting an AI feature onto a properly isolated `core/` later should mean adding a new
  use-case, not restructuring the app.
- Cloud object storage integration (e.g. for exporting evaluation data/reports), if needed —
  same reasoning: should slot in as a new infrastructure adapter, not a core change.

### 4.3 Why this scope

Small enough to realistically finish in a few weeks of evenings/weekends, per Aashir's stated
time budget, while still containing a genuinely interesting core problem (see §5.2) worth
practicing clean architecture on, and still shaped like a real product (SDK + dashboard) rather
than a toy.

---

## 5. Domain model

### 5.1 Core entities — illustrative, not final

The entity list below is a **sketch to reason with, not a locked schema.** The real domain
model needs its own dedicated modeling pass (probably the next session's work). What is fixed:
this is a **multi-tenant platform** — there will be a `User` and an organization/account
concept (`Org`/`Team`, naming TBD) above the flag-specific entities, because customers are
teams, not just individuals, and billing/plan/seat concepts will eventually hang off that
tenant boundary.

```text
User
Org (tenant / customer account — naming and shape not finalized)
  └── Project (a customer's product/API — flags live under a project; also the unit an
        installed SDK instance authenticates against, e.g. via a project API key)
        └── Flag (key, description, type: boolean for v1, defaultValue)
              └── TargetingRule[] (ordered; e.g. "if userId in [...], return true")
              └── RolloutPercentage (0-100; deterministic bucketing per user)
        └── EvaluationLog (v2+ — audit of who got what value, when)
```

An earlier prior-session exercise modeled a similar multi-tenant Team/Member/Role/Invitation
shape (see §7) — worth mining for lessons on tenancy modeling, but not to be copy-pasted
wholesale; this project's actual tenancy entities should be designed fresh against its own
requirements (e.g. how an installed SDK authenticates to a Project matters here in a way it
didn't in that prior exercise).

### 5.2 The core hard problem — rule evaluation

Given a flag's rules and a specific user's context (e.g. `{ userId, plan, region }`),
deterministically decide: `true` or `false`.

This function must be:

- **Pure and deterministic** — same flag rules + same user context → same result, always. No
  hidden state, no side effects.
- **Fast** — potentially evaluated on every request or page load, inside a customer's own
  runtime.
- **Framework-agnostic** — the exact same evaluation logic should be runnable from:
  - The Next.js dashboard app itself (server-side, e.g. for a "test this rule" preview)
  - The published npm SDK package, running inside a customer's Node.js backend
  - The same SDK running in an edge function / Cloudflare Worker context
  - The same SDK running client-side in a customer's browser bundle

If this logic is written as a plain TypeScript function/module with zero framework or database
imports, it can be reused unmodified across all of the above — and literally re-exported by
the npm package itself. This is the practical, provable test of whether the Clean Architecture
domain layer is actually decoupled, rather than just organized into folders that look
decoupled: the SDK package _is_ a second consumer of `core/`, in a different process, on a
different machine, and it must work without modification.

**Percentage rollout specifically** requires deterministic hashing (e.g. hash of
`userId + flagKey` mapped into a stable 0-100 bucket) so that a given user consistently gets
the same in/out result across repeated evaluations, rather than a random coin flip each time.

---

## 6. Architectural approach

### 6.1 Chosen style

Clean Architecture (Uncle Bob-style layering — domain/use-cases isolated from
frameworks/infrastructure), applied **strictly**, inside a Next.js full-stack repository that
also publishes part of itself (or a sibling package sharing its `core/`) as an npm SDK.
Equivalent in principle to Hexagonal/Ports-and-Adapters; the specific vocabulary used across
this project is Clean Architecture's (`core/`, `infrastructure/`, delivery via Next.js routes
and via the published SDK).

Strictness matters more here than in a typical project: the SDK package is direct, executable
proof of whether `core/` is really framework-agnostic. There's no ambiguity to hide behind —
if `core/` accidentally imports something Next.js- or Mongoose-specific, the SDK build breaks
immediately rather than the violation staying latent.

### 6.2 The Dependency Rule

Dependencies point inward only. The domain layer (entities, use-cases, repository interfaces)
must have **zero imports** of Next.js, an ORM/ODM, Vercel-specific APIs, or any external
service SDK. Infrastructure depends on domain (implements its interfaces); domain never
depends on infrastructure. This must hold regardless of which deployable (dashboard or SDK) is
consuming `core/`.

### 6.3 Layer breakdown

```text
core/                          — framework-agnostic. No Next.js, no DB driver, no Vercel APIs.
├── entities/                  — plain classes/types representing domain concepts
├── value-objects/             — small validated types (e.g. RolloutPercentage, FlagKey)
├── repositories/              — INTERFACES only (contracts), no implementation
└── use-cases/                 — application business rules; orchestrate entities + repos

infrastructure/                — implements core's interfaces using real tech
├── <db>/models/                — actual ORM/ODM schemas (MongoDB/Mongoose initially)
├── <db>/mappers/                — translate between persistence documents and domain entities
└── repositories/               — concrete repository implementations (e.g. Mongo-backed)

app/ (dashboard delivery layer — Next.js)
└── api/... or server actions  — THIN. Auth → parse input → call use-case → map result/error
                                  to HTTP. No business logic here.

sdk/ (or a sibling published package — packaging approach open, see §8)
└── the npm-published surface — wraps core/'s evaluation use-case + entities for consumption
    inside a customer's own runtime (Node.js server, edge function, or browser bundle). Must
    not depend on infrastructure/ or app/ — only on core/.
```

### 6.4 Persistence and infrastructure choices — and why they're safe to defer/change

- **Database:** MongoDB Atlas to start, chosen because it's free at this project's scale and
  Aashir already has Mongoose experience to move fast on the infrastructure layer. This is
  explicitly a "start here, not stuck here" choice — because `core/` never imports Mongoose
  directly, switching to Postgres later (e.g. if relational querying, stronger consistency
  guarantees, or a specific hosting deal becomes attractive) means writing a new
  `infrastructure/postgres/` implementation of the existing repository interfaces, not
  rewriting use-cases or entities.
- **Hosting:** Vercel, since Next.js is the dashboard's framework and Vercel is its natural
  host — a full-stack app in one repo.
- **Future external tools** (cloud storage, third-party APIs, and eventually agentic AI
  features) are expected to slot in the same way: as new `infrastructure/` adapters
  implementing interfaces defined in `core/`, never as direct dependencies pulled into
  `core/` itself. This is the concrete payoff of the strict Dependency Rule — it's what makes
  "add an AI feature later" a plausible, low-risk addition instead of a rewrite.

### 6.5 Key lessons carried in from the prior Team/Member/Invitation design pass

These were worked out in an earlier session using a real (imperfect) production schema as a
case study, and the same discipline should be applied here:

1. **Persistence-layer denormalization is fine; domain-layer denormalization is not.**
   MongoDB documents commonly duplicate fields for read performance (e.g. copying an org's
   name onto every member record so you avoid a join/populate). This is a legitimate
   infrastructure-layer decision. It must **not** leak into the domain entities or use-cases —
   those should only reason about normalized, minimal domain concepts. A **mapper** layer
   translates between the two representations; only the infrastructure/repository
   implementation is allowed to know about denormalized fields.

2. **Relationships are entities, not embedded arrays.** Modeling "a user's orgs" or "an org's
   members" as embedded arrays on User/Org documents made a many-to-many, role-bearing
   relationship ambiguous (two sources of truth). A dedicated join entity (e.g. `Member`) is
   the correct domain representation — it makes rules like "a user can own one org and be a
   low-privilege member of another" fall out naturally instead of requiring special-casing.

3. **Route handlers/Server Actions are delivery mechanisms, not business logic.** In a Next.js
   full-stack repo it's easy to let `app/api/.../route.ts` become the de facto use-case layer
   (DB calls + logic written inline). This is the single most common Clean Architecture
   violation in this kind of codebase and the main thing to consciously avoid. The SDK package
   raises the stakes on this further — any business logic accidentally left in `app/` is logic
   the SDK literally cannot access, because the SDK never runs inside the Next.js app.

4. **Use-cases should be unit-testable with zero real infrastructure** — pass in
   fake/in-memory repository implementations and assert on business outcomes, no DB
   connection required. This is a good sanity check that the domain layer is actually
   decoupled, not just nominally separated by folder.

### 6.6 Dependency injection note

Route handlers should not be manually `new`-ing up concrete repository implementations
scattered everywhere (this was flagged as a follow-up question, not yet resolved) — worth
deciding on a lightweight composition/DI approach early (could be as simple as a small
factory/container module, doesn't need a heavy DI framework). The same composition question
applies to the SDK package's own entry point (it needs to wire its evaluation use-case to
whatever fetch/cache mechanism it uses to get rules from the dashboard's API).

---

## 7. Reference: prior domain modeling exercise (Team/Member/Invitation)

For context — a separate, earlier exercise on an existing production-style Mongoose schema
(Team, User, Member, Invitation, multi-tenant with roles: Owner/Admin/Manager/User/Viewer)
produced the same architectural pattern this project intends to draw lessons from for its own
tenancy layer (see §5.1 — this project's actual entities are not yet finalized and shouldn't
be assumed identical to this reference). Key structure from that exercise:

```text
core/entities/{user,team,member,invitation}.entity.ts   — normalized, minimal
core/repositories/{...}.repository.ts                    — interfaces
core/use-cases/{team,member,user}/...                     — e.g. InviteMemberUseCase
infrastructure/mongoose/models/...                        — actual Mongoose schemas
infrastructure/mongoose/mappers/...                        — denormalized doc <-> domain entity
infrastructure/repositories/mongo-*.repository.ts          — interface implementations
app/api/teams/[teamId]/members/route.ts                    — thin delivery layer
```

This project (feature flags) can draw on the same shape for its own tenancy entities, but the
specifics (what the tenant is called, what roles exist, how a Project's API key maps to SDK
auth) need their own design pass rather than a direct copy.

---

## 8. Open questions / not yet decided

- Final tenancy entity names and shape (`Org` vs `Team`, roles, invitations) — see §5.1.
- Database choice is provisionally MongoDB Atlas (free tier, fast to start); Postgres is the
  likely future migration if/when relational needs emerge — not urgent to decide further
  given Clean Architecture makes this a later, low-risk swap.
- DI/composition approach for wiring use-cases to concrete repositories in route handlers, and
  the equivalent wiring inside the SDK package itself.
- SDK packaging approach: separate package in a monorepo (e.g. npm workspaces/Turborepo)
  sharing `core/` with the dashboard app, vs. some other structure — not yet decided, but the
  constraint is fixed: the SDK must depend only on `core/`, never on `infrastructure/` or
  `app/`.
- How an installed SDK instance authenticates to a Project and fetches/caches its rules (API
  key model, polling vs. push/webhook, offline/stale-cache behavior).
- Naming — "FlagBase" is a placeholder, not decided.
- Timing and shape of the deferred agentic AI features (§4.2) — no design work needed yet,
  noted here only so future core/use-case design doesn't foreclose it.

---

## 9. How to use this document in a new session

Paste this whole document as the first message in a new Claude conversation, then state what
you want to do next (e.g. "let's design the v1 use-cases and folder structure" or "let's
design the tenancy entities" or "let's decide the SDK packaging approach"). The new session
has full context of the business rationale and architectural decisions without needing the
original conversation history.
