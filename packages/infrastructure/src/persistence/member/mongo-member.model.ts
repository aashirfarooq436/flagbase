import { Role } from "@flagbase/core";

import { type Model, model, models,Schema } from "mongoose";

export type MemberDocument = {
  _id: string;
  organizationId: string;
  userId: string;
  role: Role;
  createdAt: Date;
};

const memberSchema = new Schema<MemberDocument>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(Role) },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// One membership per (organization, user) — docs/DOMAIN_MODEL.md §10.
memberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const MemberModel: Model<MemberDocument> =
  (models.Member as Model<MemberDocument> | undefined) ??
  model<MemberDocument>("Member", memberSchema);
