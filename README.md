# FlagBase

FlagBase is a feature-flag platform for small dev teams and indie SaaS builders — the ones who've
outgrown "deploy and watch," but for whom enterprise flag pricing is disproportionate.

Feature flags decouple _deploying_ code from _releasing_ it. Instead of a change going live for
everyone the moment it ships, it's wrapped in a runtime check, and a separate system decides who
sees it and when. That turns a risky release into a 5% rollout you can watch against real traffic,
and turns an emergency hotfix into flipping a switch instead of running a redeploy under pressure.

The platform is two halves. An **npm SDK** installs into a customer's own codebase and evaluates
flags locally against cached rules — no network round trip per check, and it runs the same in Node,
at the edge, or in the browser. A **dashboard** is where flags get created, targeted, and toggled.
Both halves share one framework-agnostic domain core, which is what keeps "what the dashboard says
a flag should do" and "what the SDK actually does" the same thing by construction.

## Documentation

- [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) — the problem, the product decision, and scope
- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — full-stack and monorepo architecture
- [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) — backend layers, rules, and lifecycle
- [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md) — entities, value objects, ports, and invariants

## Status

Early development. The architecture is designed and the monorepo is scaffolded; no packages are
built yet.

**v1 is a learning milestone, not a release.** Its scope is the control plane only — the backend
(`core`, `infrastructure`, `composition`) and the customer dashboard, including auth, orgs, team
management, and flag configuration. The SDK and the platform admin app are deliberately deferred
to v2, which means nothing consumes flags at runtime yet. The domain is still designed as though
the SDK is coming, because that constraint is what keeps `core` framework-agnostic.
