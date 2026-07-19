# Postman — FlagBase API

Collection and environment for testing the dashboard API (`apps/dashboard`).

## Files

- `collection.json` — the requests, grouped by feature (Auth, User, Organizations, Members,
  Invitations, Invitation Actions, Projects, Flags, Teardown).
- `local-environment.json` — sets `baseUrl` to `http://localhost:3000`.

## Import

In Postman: **Import** → drop both files. Select the **FlagBase — Local** environment
(top-right). Duplicate it and change `baseUrl` to test a deployed instance.

## Prerequisites

1. Run the app: `pnpm dashboard:dev` (serves on `http://localhost:3000`).
2. Create `apps/dashboard/.env.local` with `MONGODB_URI` and `SESSION_SECRET` (see
   `apps/dashboard/.env.example`) and have a Mongo **replica set** reachable. The API routes need
   these — without them they return `500`; the pages still render.

## Auth is cookie-based — no token to copy

Sign Up / Sign In set an **httpOnly** cookie (`flagbase_session`). Postman's cookie jar stores it
and attaches it to the authenticated requests automatically, so you never handle a bearer token.
Keep cookie capture on (Postman default). **Teardown → Sign Out** clears it.

## URLs are nested and org-scoped

Projects and flags live under an organization:

```
/api/organizations/{orgId}/projects/{projectId}/flags/{flagId}
```

You don't paste IDs by hand — each create request captures its id into a collection variable
(`orgId`, `projectId`, `flagId`, `memberId`, `invitationId`) for the requests that follow.

## Run order

A full top-to-bottom Collection Run works: it walks create → read → update for every resource and
gathers the destructive deletes in **Teardown** at the end.

| #   | Folder                 | What it does                                                              |
| --- | ---------------------- | ------------------------------------------------------------------------ |
| 1   | **Auth**               | Sign Up (unique email each run) → Sign In                                |
| 2   | **User**               | Get / Update profile at `/api/users/me`, Change Password                  |
| 3   | **Organizations**      | List → Create (saves `orgId`) → Get → Rename                             |
| 4   | **Members**            | List (saves `memberId`) → Change Role → Remove — see the note below      |
| 5   | **Invitations**        | List → Invite (saves `invitationId`) → Revoke                            |
| 6   | **Invitation Actions** | Accept / Reject by token — see the note below                            |
| 7   | **Projects**           | List → Create (saves `projectId`) → Get → Rename                        |
| 8   | **Flags**              | List → Create (saves `flagId`) → Get → Toggle → Rules → Evaluate → Delete |
| 9   | **Teardown**           | Delete Project → Sign Out                                                 |

Most requests carry strict test assertions (status codes, `passwordHash`/`token` never on the wire,
captured-id round-trips), so a Collection Run gives a quick green/red pass.

### Two folders need a second actor

These can't fully succeed with a single signed-in user, so they use **lenient** assertions (accept
the documented status range) and stay green:

- **Members → Change Role / Remove** — in a fresh org the only member is you, the **owner**. Owner's
  role can't be changed and the last owner can't be removed, so these return a policy error by
  design. Assignable roles are `admin` | `member` only (owner is transferred, never assigned).
- **Invitation Actions → Accept / Reject** — the invite **token is never returned on the wire**
  (it's a secret, sent only in the email). Locally the `ConsoleEmailSender` logs it — copy it into
  the `invitationToken` collection variable, then these return a real `200`.

## Variables

Set on the collection (**Variables** tab); `baseUrl` also comes from the environment.

| Variable                                                   | Purpose                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `baseUrl`                                                  | Server origin                                                     |
| `name`, `password`, `newPassword`                          | Sample user data                                                  |
| `orgName`, `projectName`, `flagKey`, `inviteEmail`         | Sample resource data                                             |
| `email`                                                    | Set automatically by Sign Up; reused by Sign In / profile         |
| `orgId`, `projectId`, `flagId`, `memberId`, `invitationId` | Captured from their create/list requests                          |
| `invitationToken`                                          | **Manual** — paste from the invite email/console to Accept/Reject |

## Keeping it current

When you add or change API routes, mirror them here (folder = feature grouping) and keep the
capture-id chain intact. The surface covered today matches the `apps/dashboard/src/app/api` tree:
auth `{sign-up,sign-in,sign-out}`; `users/me` (+ `/password`); `organizations` (+ `/{orgId}`);
`members` (+ role change / remove); `invitations` (+ revoke) and top-level `invitations/{accept,reject}`;
`projects` (full CRUD); `flags` (CRUD + `/rules`, `/evaluate`).
