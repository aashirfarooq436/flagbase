# Deploying to Vercel

FlagBase is a Turborepo monorepo; only **`apps/dashboard`** (the Next.js app) is deployed.

## Environments

| Vercel slot | Branch | Purpose | Set up now? |
| --- | --- | --- | --- |
| Primary deployment (Vercel labels it "Production") | `develop` | **Staging** | ✅ yes |
| Real production | `main` | Production | later — `main` is ~45 commits behind `develop` |

Vercel's "Production" is just its name for the primary deployment of the tracked branch — **not**
your app's production. We point it at `develop`, so **`develop` is your live staging**. When `main`
catches up and you're ready, switch the Production Branch to `main` (see _Future_ below).

## One-time setup

### 1. Push `develop`

Vercel deploys from GitHub — make sure `develop` is pushed:

```bash
git push origin develop
```

### 2. Import the project

- vercel.com → **Add New → Project** → import `aashirfarooq436/flagbase`.
- **Root Directory: `apps/dashboard`.** Vercel detects Next.js and the pnpm/Turborepo workspace —
  it installs at the repo root and builds the app. pnpm 11 comes from the `packageManager` pin.
- Framework preset: **Next.js** (auto). Leave the build/install commands as detected.

### 3. Set the deployed branch

Project → **Settings → Git → Production Branch = `develop`** (otherwise Vercel tries `main`, which is
behind and has no app).

### 4. Environment variables

Project → **Settings → Environment Variables**. Add to **Production** and **Preview**:

| Key | Value |
| --- | --- |
| `MONGODB_URI` | Atlas connection string for staging — include a dedicated DB name, e.g. `…mongodb.net/flagbase_staging`. |
| `SESSION_SECRET` | A **new** random ≥32-char secret: `openssl rand -base64 32`. Do **not** reuse the local one. |
| `SESSION_COOKIE_NAME` | _(optional)_ — defaults to `flagbase_session`. |

Do **not** set `NODE_ENV`; Vercel manages it (always `production` on deployments).

### 5. Atlas network access (critical)

Vercel serverless functions use **dynamic IPs**, so in Atlas → **Network Access** add **`0.0.0.0/0`**
(or use the MongoDB Atlas ↔ Vercel integration). Without it the deployed app cannot reach the DB.

### 6. Deploy

Push to `develop` (or hit **Redeploy**). Staging is served at the project's primary domain
(`<project>.vercel.app`) and the branch alias (`<project>-git-develop-<scope>.vercel.app`).

## Things to know

- **Dev panel** keys off `NODE_ENV`, which Vercel sets to `production` even on this staging deploy,
  so the inspector won't appear on the deployed app (only on local `pnpm dashboard:dev`). To show it
  on staging, gate it on `process.env.VERCEL_ENV === "preview"` instead.
- **Cookies:** `JwtSessionManager` sets `secure: true` in production; Vercel is HTTPS, so sessions work.
- **Indexes:** `ensureIndexes()` isn't wired into startup, so the unique-index race backstops won't
  exist on the deployed DB yet (the use-cases still check first). Wire it into a startup path/route
  when you want the guarantee.
- **Native deps:** `argon2` ships prebuilt Linux binaries (works on Vercel); `mongodb-memory-server`
  is dev-only and isn't bundled into the functions.

## Future — promoting `main` to real production

1. Bring `main` up to date with `develop` (merge / fast-forward).
2. **Settings → Git → Production Branch = `main`.**
3. Re-scope env vars: real production `MONGODB_URI` (prod cluster) + a distinct `SESSION_SECRET`
   under **Production**; keep the staging values under **Preview** (which `develop` now uses).
   Optionally give `develop` a stable domain (**Settings → Domains** → assign to the `develop` branch).
4. Result: `main` → production, `develop` → staging.
```
