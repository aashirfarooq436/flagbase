import { type Model, Schema, model, models } from "mongoose";

/**
 * The persisted shape of a Flag. This is deliberately NOT the domain entity — it's the
 * document, with primitives where the domain has value objects (key is a string here,
 * a FlagKey there) and a discriminated shape for targeting rules. The mapper is what
 * bridges the two; nothing outside this folder should see this type.
 */
export type TargetingRuleDocument = {
  type: "user-id-list";
  userIds: string[];
  value: boolean;
};

export type FlagDocument = {
  _id: string;
  projectId: string;
  key: string;
  description: string;
  enabled: boolean;
  targetingRules: TargetingRuleDocument[];
  rolloutPercentage: number;
  defaultValue: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const targetingRuleSchema = new Schema<TargetingRuleDocument>(
  {
    type: { type: String, required: true, enum: ["user-id-list"] },
    userIds: { type: [String], required: true },
    value: { type: Boolean, required: true },
  },
  { _id: false },
);

const flagSchema = new Schema<FlagDocument>(
  {
    // The domain-generated UUID is the _id itself — no separate ObjectId. This is what
    // keeps core ignorant of Mongo: the id a use-case mints is the id in the database.
    _id: { type: String },
    projectId: { type: String, required: true },
    key: { type: String, required: true },
    description: { type: String, default: "" },
    enabled: { type: Boolean, required: true },
    targetingRules: { type: [targetingRuleSchema], default: [] },
    rolloutPercentage: { type: Number, required: true },
    defaultValue: { type: Boolean, required: true },
    // createdAt/updatedAt are managed by the domain entity, not Mongoose timestamps —
    // the entity decides when it was touched, so persistence just stores what it's told.
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// The backstop for "flag key is unique per project" (docs/DOMAIN_MODEL.md §10). The
// use-case checks first; this index is what holds when two requests race.
flagSchema.index({ projectId: 1, key: 1 }, { unique: true });

// `models.Flag ??` guard: Next.js hot reload re-imports this module, and registering a
// model name twice throws. Reuse the already-registered model if present. The explicit
// annotation is needed because models.Flag is typed as Model<any>, which would widen
// FlagModel and make its query methods non-callable.
export const FlagModel: Model<FlagDocument> =
  (models.Flag as Model<FlagDocument> | undefined) ??
  model<FlagDocument>("Flag", flagSchema);
