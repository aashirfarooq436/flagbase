import { type Model, model, models, Schema } from "mongoose";

export type OrganizationDocument = {
  _id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

const organizationSchema = new Schema<OrganizationDocument>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    // Unique across all organizations — the URL slug. A collision surfaces as a duplicate-key
    // error that the repository translates into a ConflictError (backstops the use-case check).
    slug: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const OrganizationModel: Model<OrganizationDocument> =
  (models.Organization as Model<OrganizationDocument> | undefined) ??
  model<OrganizationDocument>("Organization", organizationSchema);
