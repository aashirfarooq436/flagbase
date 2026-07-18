# `externals/` — third-party integrations

Home for integrations with outside services (email, AI, notifications, analytics, …), built
behind a small interface so swapping providers is a one-file job, not a rewrite.

**But most integrations do NOT belong here.** Where an integration lives is decided by _who
consumes it_ — that's what keeps the architecture swappable without leaking a vendor across
layers:

| If it's used by…                                       | It lives in…                                              | Example                                                                |
| ------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| a **use-case** (domain/business logic)                 | a **core port** + an adapter in `packages/infrastructure` | email (`IEmailSender` → `SendGridEmailSender`); a future AI/Slack port |
| the **session / auth** flow                            | `lib/auth` (the `SessionManager` seam)                    | Clerk / Auth0 as alternative `SessionManager` impls                    |
| **only the delivery layer / client**, never a use-case | **here (`lib/externals/`)**                               | Sentry, PostHog, a client-side widget                                  |

So: email, and any AI/notification triggered by business logic, are **core ports + infra
adapters** — swap them in `composition`, not here. Auth providers are `SessionManager`
implementations in `lib/auth`. This folder is reserved for genuinely app-only integrations.

**Pattern when one is added here:** define an interface (`Analytics`, `CrashReporter`, …), a
concrete adapter (`PostHogAnalytics`), and select the implementation in one place (a factory /
provider), so the rest of the app depends on the interface. No such integration exists in v1 —
this README is the placeholder; adapters get built when a feature needs one.
