import { InvitationStatus, Role } from "@flagbase/core";

import { type Model, model, models, Schema } from "mongoose";

export type InvitationDocument = {
  _id: string;
  organizationId: string;
  email: string;
  role: Role;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  invitedByUserId: string;
  createdAt: Date;
  acceptedAt: Date | null;
};

const invitationSchema = new Schema<InvitationDocument>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(Role) },
    tokenHash: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(InvitationStatus),
    },
    expiresAt: { type: Date, required: true },
    invitedByUserId: { type: String, required: true },
    createdAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

// Each invite token is unique — it's the credential the invitee presents to accept.
invitationSchema.index({ tokenHash: 1 }, { unique: true });

export const InvitationModel: Model<InvitationDocument> =
  (models.Invitation as Model<InvitationDocument> | undefined) ??
  model<InvitationDocument>("Invitation", invitationSchema);
