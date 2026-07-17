import { type Model, Schema, model, models } from "mongoose";

export type UserDocument = {
  _id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    _id: { type: String },
    email: { type: String, required: true },
    name: { type: String, required: true },
    passwordHash: { type: String, default: null },
    emailVerifiedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// Email is the account-linking key, so it must be globally unique — docs/DOMAIN_MODEL.md §10.
// The value stored is already normalized by the Email value object.
userSchema.index({ email: 1 }, { unique: true });

export const UserModel: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);
