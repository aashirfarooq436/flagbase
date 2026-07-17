import type { Email } from "../../shared/email.vo";
import {
  type Invitation,
  InvitationStatus,
} from "../../domain/invitation/invitation.entity";
import type { IInvitationRepository } from "../../domain/invitation/invitation.repository";

/** An in-memory IInvitationRepository for testing use-cases with zero infrastructure. */
export class InMemoryInvitationRepository implements IInvitationRepository {
  private readonly store = new Map<string, Invitation>();

  constructor(seed: Invitation[] = []) {
    for (const invitation of seed) {
      this.store.set(invitation.id, invitation);
    }
  }

  async findById(id: string): Promise<Invitation | null> {
    return this.store.get(id) ?? null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    for (const invitation of this.store.values()) {
      if (invitation.tokenHash === tokenHash) {
        return invitation;
      }
    }
    return null;
  }

  async findPendingByOrganizationAndEmail(
    organizationId: string,
    email: Email,
  ): Promise<Invitation | null> {
    for (const invitation of this.store.values()) {
      if (
        invitation.organizationId === organizationId &&
        invitation.email.equals(email) &&
        invitation.status === InvitationStatus.Pending
      ) {
        return invitation;
      }
    }
    return null;
  }

  async findByOrganizationId(organizationId: string): Promise<Invitation[]> {
    return [...this.store.values()].filter(
      (invitation) => invitation.organizationId === organizationId,
    );
  }

  async save(invitation: Invitation): Promise<void> {
    this.store.set(invitation.id, invitation);
  }
}
