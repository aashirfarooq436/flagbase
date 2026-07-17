import { Email, Invitation } from "@flagbase/core";

import type { InvitationDocument } from "./invitation.model";

export class InvitationMapper {
  static toDomain(document: InvitationDocument): Invitation {
    // Reconstructs via the constructor, not Invitation.create — create enforces
    // "expires in the future", which a persisted (possibly already-expired) invitation
    // must be allowed to violate. The constructor still guards role and tokenHash.
    return new Invitation({
      id: document._id,
      organizationId: document.organizationId,
      email: new Email(document.email),
      role: document.role,
      tokenHash: document.tokenHash,
      status: document.status,
      expiresAt: document.expiresAt,
      invitedByUserId: document.invitedByUserId,
      createdAt: document.createdAt,
      acceptedAt: document.acceptedAt,
    });
  }

  static toDocument(invitation: Invitation): InvitationDocument {
    return {
      _id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email.value,
      role: invitation.role,
      tokenHash: invitation.tokenHash,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      invitedByUserId: invitation.invitedByUserId,
      createdAt: invitation.createdAt,
      acceptedAt: invitation.acceptedAt,
    };
  }
}
