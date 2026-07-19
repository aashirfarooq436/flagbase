import type { Model } from "mongoose";

import { FlagModel } from "../../persistence/flag/mongo-flag.model";
import { InvitationModel } from "../../persistence/invitation/mongo-invitation.model";
import { MemberModel } from "../../persistence/member/mongo-member.model";
import { OrganizationModel } from "../../persistence/organization/mongo-organization.model";
import { ProjectModel } from "../../persistence/project/mongo-project.model";
import { UserModel } from "../../persistence/user/mongo-user.model";

// Every persisted model. Listed explicitly (not discovered) so a new model is a
// conscious addition here, and so index provisioning can't silently skip one.
const MODELS: Model<unknown>[] = [
  UserModel,
  OrganizationModel,
  MemberModel,
  InvitationModel,
  ProjectModel,
  FlagModel,
] as unknown as Model<unknown>[];

/**
 * Build every model's declared indexes before the app serves writes.
 *
 * The unique indexes are the race backstop for the check-then-write invariants —
 * unique email, one membership per (organizationId, userId), one flag key per
 * (projectId, key), one invitation per tokenHash. A check-first guard in a use-case
 * can lose a race; the index is what turns a concurrent duplicate into a hard failure
 * (translated to ConflictError). That backstop only works if the index actually EXISTS.
 *
 * `ensureConnection` disables Mongoose's implicit background index build
 * (`autoIndex: false`), because a background build gives no guarantee the constraint is
 * present when the first writes land — precisely the cold-start window two racing
 * upserts could slip through. The startup/composition path must call this once, after
 * connecting, so provisioning is explicit and awaited.
 *
 * Uses `syncIndexes()`: it creates declared indexes AND drops any left on the
 * collection that the schema no longer declares, keeping the deployed indexes in lockstep
 * with the models. (Prefer `init()` over `syncIndexes()` only if a collection is expected
 * to carry indexes managed outside this codebase — it isn't here.)
 */
export async function ensureIndexes(): Promise<void> {
  await Promise.all(MODELS.map((model) => model.syncIndexes()));
}
