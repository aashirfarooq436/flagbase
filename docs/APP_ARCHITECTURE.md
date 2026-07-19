# FlagBase — App (Delivery) Architecture

The authority for the **app/delivery layer**: the Next.js dashboard, the shared monorepo UI
surface, state management, auth, and conventions. Companion to `SYSTEM_DESIGN.md` (whole-stack
shape) and `BACKEND_ARCHITECTURE.md` (core/infrastructure). Where this doc and the frontend
sections of `SYSTEM_DESIGN.md` (§5–§6) disagree, **this doc wins** — it's the reconsidered design.

The Prime Directive still holds above everything: `packages/core` imports nothing. The app layer
consumes `core`, `composition`, `contracts`, Next, and its UI stack — **never `infrastructure`
directly** (only `composition` constructs concrete repositories).

---

## 1. Guiding conventions

1. **Name folders by concern, never by tool/framework.** The point of the whole repo is to be
   swappable underneath. A folder called `casl/` would rot the day we swap CASL; `abilities/`
   survives it. Same reason `core` never imports a framework. So: `abilities/` not `casl/`,
   `auth/` (the concern) not `nextauth/`, `query/` (data reads) not `react-query/`. The tool is an
   implementation detail _inside_ the folder, free to change.
2. **Extract app-agnostic code into `packages/`; keep app-specific composition in the app.** This
   is what makes the second app (`apps/admin`, [v2]) cheap. The test: _would `apps/admin` want this
   unchanged?_ If yes → a package. If it knows about _this_ app's routes/data → stays in the app.
3. **Don't extract for a single consumer.** Design the seam now, lift the module when the second
   consumer actually arrives. Speculative shared packages are premature abstraction.

---

## 2. Monorepo package map

Everything app-agnostic lives in `packages/`. The apps are thin.

| Package                  | Holds                                                                                                                                                                                                 | Consumed by                       | Status                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `packages/ui`            | Design system: **atomic** shadcn primitives, design tokens (CSS vars), Tailwind preset, `ThemeProvider`, `cn()`, lucide re-export                                                                     | dashboard **+ admin**             | build now                                                        |
| `packages/eslint-config` | Shared lint config (base / next / react) — owns import ordering (`simple-import-sort`) + unused-import pruning; Prettier is formatting-only                                                           | all                               | build now                                                        |
| `packages/shared`        | Technical, framework-agnostic toolkit (a `Logger` interface + `ConsoleLogger`; more cross-cutting tools over time). Zero-dep. NOT the domain kernel (`core/src/shared`); **never imported by `core`** | infrastructure, composition, apps | built                                                            |
| `packages/contracts`     | DTO types + Zod request schemas                                                                                                                                                                       | both apps' clients **and** routes | built                                                            |
| `packages/composition`   | Wires concrete repos → use-cases. **No web/Next code, ever.**                                                                                                                                         | apps (via imports)                | built                                                            |
| `packages/web-kit`       | App-agnostic delivery slice: `withDb`, `SessionManager` + `JwtSessionManager`, `BaseApiService` transport + error→toast mapper, React Query client defaults                                           | dashboard **+ admin**             | **planned seam** — lift from dashboard's `lib/` when admin lands |
| `packages/sdk`           | Published npm client (§7 SYSTEM_DESIGN)                                                                                                                                                               | customer runtimes                 | [v2]                                                             |

**Why `composition` and `web-kit` are separate packages:** wiring use-cases (no I/O, no framework)
and HTTP/session plumbing (Next-coupled) are different concerns. Folding `withDb` into
`composition` would drag Next into a package that must stay framework-free.

**Why `web-kit` isn't built yet:** `withDb` and the JWT `SessionManager` are genuinely shared with
admin (same _mechanism_, different _identity_ — `User` vs `PlatformAdmin`). But extracting a shared
package for a single current consumer is speculative. They live as **self-contained modules inside
`apps/dashboard/lib/`** now, written so lifting them to `packages/web-kit` is a move, not a
rewrite. `withAuth` / `withAbility` themselves stay per-app (they resolve different identities).

### 2.1 The atomic UI split

`packages/ui` holds **atoms/primitives** — components that know nothing about FlagBase's data:
Button, Input, Label, Dialog, DropdownMenu, Select, Table, Card, Badge, Form field wrappers,
Skeleton, the Sonner toaster. Plus the design tokens, the Tailwind preset, `ThemeProvider`, `cn()`.

**Composed, feature-aware components stay in each app** (`apps/dashboard/components/<feature>/`):
`MemberTable`, `OrgSwitcher`, `InviteMemberDialog`. They import atoms from `@flagbase/ui` but know
about _this_ app's queries and routes, so they are not shareable and don't belong in `ui`.

**shadcn in the monorepo:** `components.json` targets `packages/ui`; apps consume via
`@flagbase/ui`. Tokens + Tailwind preset live in `ui` and both apps import them, so dashboard and
admin are visually consistent by construction.

---

## 3. `apps/dashboard` structure

```text
apps/dashboard/           (code lives under src/ — src/app, src/lib)
├── src/app/
│   ├── layout.tsx                 — RootLayout: <html suppressHydrationWarning>/<body> ONLY.
│   │                                No providers here — kept bare so a future top-level route
│   │                                group can bring an entirely different provider tree.
│   ├── (pages)/                   — every real app page, grouped to share one provider tree
│   │   ├── layout.tsx             — AppProviders: ThemeProvider + QueryClientProvider +
│   │   │                            ApiServiceProvider + Toaster. ALL providers live here.
│   │   ├── (public)/              — unauthenticated
│   │   │   ├── layout.tsx         — centered minimal chrome
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   └── (auth)/                — authenticated; session required
│   │       ├── layout.tsx         — guard: sessionManager.resolve() → redirect /sign-in if null
│   │       ├── onboarding/page.tsx        — create the first org (user has none yet)
│   │       └── orgs/[orgId]/
│   │           ├── layout.tsx     — app shell: sidebar, org switcher, topbar
│   │           ├── page.tsx  members/  invitations/  settings/
│   └── api/                       — route.ts handlers, defined with the route() builder (§6.1)
└── src/lib/
    ├── auth/          session-manager.ts (SessionManager + JwtSessionManager)   ← lifts to web-kit
    ├── abilities/     build-ability.ts (domain Role → CASL ability), policy vocabulary
    ├── decorators/    with-db · with-auth · with-ability · with-app-handlers    ← withDb lifts
    ├── api-client/    base-api-service · <feature>.api-service · api-client · provider
    ├── query/         query-client · query-keys · use-members / use-org / …  (RQ over ApiClient)
    ├── stores/        ui.store.ts (Zustand — client/UI state only)
    ├── presenters/    entity → contracts DTO
    └── validation/    RHF resolvers over contracts Zod schemas
```

### 3.1 Layouts & providers

- **`app/layout.tsx` (root)** — bare: `<html lang="en" suppressHydrationWarning><body>{children}
  </body></html>`. `suppressHydrationWarning` stays here because `next-themes` writes the theme
  class onto `<html>` before hydration; that's the one root concession.
- **`(pages)/layout.tsx`** — the single home for **all** providers: `ThemeProvider`,
  `QueryClientProvider`, `ApiServiceProvider`, `Toaster`. Concentrating them here means `(pages)`
  is a clean sibling — a future `(marketing)` / `(embed)` group at app root can define a completely
  different provider stack without inheriting this one.
- **`(public)` vs `(auth)`** — differ only in _chrome_ (centered card vs full app shell) and
  _guarding_ (`(auth)/layout.tsx` redirects when there's no session). Same providers.

---

## 4. State ownership

Four tools, four non-overlapping jobs. The one rule that keeps it honest: **server data never goes
in Zustand.**

| Concern                                                    | Owner                              | Example                                                           |
| ---------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Server data (orgs, members, flags, invitations, "me")      | **React Query**                    | `useQuery(memberKeys.list(orgId), () => api.members.list(orgId))` |
| Client/UI state (sidebar, open dialogs, ephemeral toggles) | **Zustand**                        | `useUiStore(s => s.sidebarCollapsed)`                             |
| Dependency injection (the `ApiClient` instance)            | **Context**                        | `ApiServiceProvider` → `useApiService()`                          |
| Theme                                                      | **next-themes**                    | `useTheme()`                                                      |
| Active organization                                        | **URL route param** `orgs/[orgId]` | source of truth — shareable, no desync                            |

React Query owns anything fetched from the API; Zustand only genuinely-client ephemeral state.

---

## 5. Authentication — a swappable session behind a port

Core already verifies credentials (`SignInUseCase` + argon2). The **session** is a delivery
concern, hidden behind an interface so today's JWT and a future Auth0 are an implementation swap,
not a call-site change. This is the Prime Directive applied to the delivery layer.

```typescript
// lib/auth/session-manager.ts — the seam
export interface SessionManager {
  issue(subject: { id: string }): Promise<void>; // sign + set httpOnly cookie
  resolve(): Promise<{ userId: string } | null>; // verify cookie → identity
  destroy(): Promise<void>; // logout
}
```

- **`JwtSessionManager` (now)** — `jose` signs a minimal session JWT `{ sub: userId }` into an
  httpOnly, `SameSite=Lax`, `Secure` cookie; `resolve()` verifies signature + expiry. Stateless.
  The token carries **identity only** — never role/org, because those change and a token would go
  stale; role is loaded fresh per request (§6).
- **`Auth0SessionManager` (later)** — same interface, validates an Auth0 session instead. Nothing
  else in the app changes: `withAuth` only ever calls `resolve()`. This module lifts to
  `packages/web-kit` when admin needs it (admin issues sessions for `PlatformAdmin` — same
  mechanism, generic subject id).

**Flow:** `POST /api/auth/sign-in` → `SignInUseCase.execute()` → `sessionManager.issue(user)`.
`POST /api/auth/sign-out` → `sessionManager.destroy()`. `withAuth` → `resolve()` → attaches
`userId` (401/redirect if null).

### 5.1 Two small core read use-cases this path needs

The delivery layer must not touch repositories directly, so the session/authorization path needs
two thin **read** use-cases in `core` (pure, in-layer — they wrap existing repo methods):

- `GetCurrentUserUseCase(userId) → User | null` — wraps `IUserRepository.findById`. For "me".
- `GetMembershipUseCase(organizationId, userId) → Member | null` — wraps
  `IMemberRepository.findByOrganizationAndUser`. Supplies the role for ability-building and the
  delivery-layer tenant check.

---

## 6. Authorization — `abilities/` (CASL is the impl)

`core/domain/member/role.ts` defines what roles _mean_ as plain data (`ROLE_PERMISSIONS`), with no
CASL import. `lib/abilities/build-ability.ts` is the **only** place `@casl/ability` is imported: it
reads `ROLE_PERMISSIONS` for a user's role in the active org and returns an `AppAbility`.

`withAbility(action, subject)` runs on org-scoped routes: loads the membership
(`GetMembershipUseCase(orgId, userId)`), builds the ability from its role, and enforces the check —
**not a member ⇒ 403**. This is delivery-layer RBAC _and_ a tenant gate, complementing (defense in
depth, not replacing) the tenant-guard already enforced inside the use-cases.

### 6.1 API routes — the `route()` builder

Every API route is a **declarative definition** via one builder, `route()` (`lib/route.ts`) — no
inline plumbing, no magic status numbers, full identifier names:

```ts
export const POST = route({
  access: "organization",
  action: "manage",
  subject: "Project",
  body: createProjectRequestSchema,
  status: HttpStatus.Created,
  handle: async ({ body, context }) =>
    toProjectResponse(
      await composition.project.create.execute({
        organizationId: context.organizationId,
        name: body.name,
      }),
    ),
});
```

You declare the **access level** (`public` · `user` · `organization`), the input **schemas**
(`body` / `query` / `params`), the success **`HttpStatus`**, and a **`handle`** that receives
already-parsed input + a typed `context` and returns a DTO. The builder does the parsing, the
decorator chain, the `NextResponse`, and `204`-on-`void`. `route()` composes the `with-*`
decorators by access: `public` = `withErrorHandling ∘ withDb`; `user` = `+ withAuth + withUser`;
`organization` = `+ withOrganization` (loads membership + builds the CASL ability) `+ withAbility`
(when `action`/`subject` are set). **`HttpStatus`** — named codes, mirroring the error taxonomy —
lives in `@flagbase/shared/http`.

**The surface** (RESTful, org-scoped resources nested): `auth/{sign-in,sign-up,sign-out}` ·
`users/me` (+`/password`) · `organizations[/[id]]` · `…/members[/[memberId]]` ·
`…/invitations[/[invitationId]]` + `invitations/{accept,reject}` · `…/projects[/[projectId]]` ·
`…/projects/[projectId]/flags[/[flagId]]` (+ `/rules`, `/evaluate`).

---

## 7. API client, queries, forms

- **API client** (`lib/api-client/`) — unchanged from `SYSTEM_DESIGN.md` §6: `BaseApiService`
  (transport + error normalization) → per-feature services → `ApiClient`, injected via
  `ApiServiceProvider`, read with `useApiService()`. `BaseApiService` lifts to `web-kit` later.
- **Query hooks** (`lib/query/`) — React Query over the client. `use-members(orgId)` is
  `useQuery(memberKeys.list(orgId), () => api.members.list(orgId))`. Query-key factories live here.
  Mutations use `useMutation` + `queryClient.invalidateQueries`.
- **Forms** (`lib/validation/`) — `react-hook-form` + `@hookform/resolvers/zod`, resolver fed the
  **contracts Zod schema**, so the client validates with the exact rule the route enforces. No
  duplicate validation logic.

### 7.1 Data flow

- **Write:** component → RQ `useMutation` → `apiClient.x.method()` → `PATCH/POST /api/…` →
  `withDb → withAuth → withAbility` → route → `composition.x.execute()` → `Presenter.toResponse()`
  → JSON. On success → `invalidateQueries`.
- **Read:** component → RQ `useQuery` → `apiClient.x.list()` → `GET /api/…` → same decorator chain
  → use-case → presenter → JSON → cached.

### 7.2 Errors

Core throws typed `DomainError`s with a `code`. The route maps `code` → HTTP status; the client maps
`code` → a `sonner` toast. One `ErrorResponse` shape (from `contracts`) on both ends, so a mismatch
is a type error, not a runtime surprise.

---

## 8. Design system & theming

- **Tokens** — CSS custom properties (`--background`, `--foreground`, `--primary`, …) with a light
  set and a dark set, plus a small FlagBase brand accent scale. Defined in `packages/ui`, imported
  by both apps.
- **Dark/light** — `next-themes` toggles a `class` on `<html>`; components read tokens, never
  hard-coded colors, so both themes come for free.
- **Components** — shadcn primitives (owned source in `packages/ui`), composed into feature
  components per app. Tailwind preset shared from `ui`.

---

## 9. v1 surface (customer dashboard)

Onboard + manage organization — every screen maps to an existing use-case:

- **Sign up / Sign in** → `SignUpUseCase` / `SignInUseCase`.
- **Onboarding** (no org yet) → create organization → `CreateOrganizationUseCase` (the UoW
  transaction: Organization + owner Member).
- **Org home / settings** → `GetOrganizationUseCase`, `RenameOrganizationUseCase`.
- **Members** → `ListMembersUseCase`, `ChangeMemberRoleUseCase`, `RemoveMemberUseCase`.
- **Invitations** → `InviteMemberUseCase`, `ListPendingInvitationsUseCase`,
  `RevokeInvitationUseCase`, accept/reject.
- **Org switcher** → `ListMyOrganizationsUseCase`.
- **Projects** → create / list / get / rename / delete.
- **Flags** → create / toggle (enabled) / update rules / evaluate ("test this rule") / delete.

**v1 is the complete web dashboard** — user, organization, project, and flag flows, all with UI
(expanded 2026-07-19; flags/projects are no longer deferred). The **API routes for the whole
surface are built** (§6.1); the remaining work is the UI (components + pages) per feature.

---

## 10. Deferred / open

- **`packages/web-kit`** — lift `withDb`, `SessionManager`+`JwtSessionManager`, `BaseApiService`,
  RQ defaults out of dashboard `lib/` when `apps/admin` is built.
- **`apps/admin`** [v2] — `SYSTEM_DESIGN.md` §9. Reuses `ui`, `contracts`, `composition`,
  `web-kit`; its own `withAdminAuth` / `withAdminAbility` over `PlatformAdmin` / `PlatformRole`.
- Exact CASL action/subject vocabulary beyond `manage`/`read` (`SYSTEM_DESIGN.md` §10).
- Password reset / email verification — not in v1 scope.
