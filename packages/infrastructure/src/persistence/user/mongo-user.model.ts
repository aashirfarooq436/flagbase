import { type Model, model, models,Schema } from "mongoose";

export type UserDocument = {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    _id: { type: String },
    email: { type: String, required: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

// Email is the login identifier, so it must be globally unique — docs/DOMAIN_MODEL.md §10.
// The value stored is already normalized by the Email value object.
userSchema.index({ email: 1 }, { unique: true });

export const UserModel: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);
