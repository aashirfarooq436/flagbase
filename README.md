# FlagBase

FlagBase is a feature-flag platform for small dev teams and indie SaaS builders — the ones who've
outgrown "deploy and watch," but for whom enterprise flag pricing is disproportionate.

Feature flags decouple *deploying* code from *releasing* it. Instead of a change going live for
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

## Status

Early development — the architecture is designed and the monorepo is scaffolded; the packages are
not built yet.
