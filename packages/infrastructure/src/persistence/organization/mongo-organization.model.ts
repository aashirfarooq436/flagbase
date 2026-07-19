import { type Model, model, models, Schema } from "mongoose";

export type OrganizationDocument = {
  _id: string;
  name: string;
  createdAt: Date;
};

const organizationSchema = new Schema<OrganizationDocument>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const OrganizationModel: Model<OrganizationDocument> =
  (models.Organization as Model<OrganizationDocument> | undefined) ??
  model<OrganizationDocument>("Organization", organizationSchema);
