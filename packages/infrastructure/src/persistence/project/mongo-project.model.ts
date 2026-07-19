import { type Model, model, models, Schema } from "mongoose";

export type ProjectDocument = {
  _id: string;
  organizationId: string;
  name: string;
  createdAt: Date;
};

const projectSchema = new Schema<ProjectDocument>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const ProjectModel: Model<ProjectDocument> =
  (models.Project as Model<ProjectDocument> | undefined) ??
  model<ProjectDocument>("Project", projectSchema);
