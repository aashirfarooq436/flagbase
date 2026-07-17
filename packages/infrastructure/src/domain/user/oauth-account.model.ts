import { OAuthProvider } from "@flagbase/core";
import { type Model, Schema, model, models } from "mongoose";

export type OAuthAccountDocument = {
  _id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  createdAt: Date;
};

const oauthAccountSchema = new Schema<OAuthAccountDocument>(
  {
    _id: { type: String },
    userId: { type: String, required: true, index: true },
    provider: {
      type: String,
      required: true,
      enum: Object.values(OAuthProvider),
    },
    providerAccountId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// One account per external identity — the same Google subject can't link to two users.
oauthAccountSchema.index(
  { provider: 1, providerAccountId: 1 },
  { unique: true },
);

export const OAuthAccountModel: Model<OAuthAccountDocument> =
  (models.OAuthAccount as Model<OAuthAccountDocument> | undefined) ??
  model<OAuthAccountDocument>("OAuthAccount", oauthAccountSchema);
