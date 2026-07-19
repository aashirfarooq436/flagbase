import type {
  InvitationResponse,
  InvitationTokenRequest,
  InviteMemberRequest,
  MemberResponse,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/**
 * Invitations. Org-scoped management lives under
 * `/api/organizations/:organizationId/invitations`; the invitee's accept/reject act on the raw
 * token from the email and are top-level under `/api/invitations` (the invitee isn't a member
 * yet, so they can't address the org-scoped resource).
 */
export class InvitationService extends BaseService {
  /** `GET …/invitations` — the organization's invitations. */
  list(organizationId: string): Promise<InvitationResponse[]> {
    return this.get<InvitationResponse[]>(this.base(organizationId));
  }

  /** `POST …/invitations` — invite someone by email with a role. */
  invite(
    organizationId: string,
    body: InviteMemberRequest,
  ): Promise<InvitationResponse> {
    return this.post<InvitationResponse>(this.base(organizationId), body);
  }

  /** `DELETE …/invitations/:invitationId` — revoke a pending invite. */
  revoke(organizationId: string, invitationId: string): Promise<void> {
    return this.delete<void>(`${this.base(organizationId)}/${invitationId}`);
  }

  /** `POST /invitations/accept` — the invitee accepts; returns their new membership. */
  accept(body: InvitationTokenRequest): Promise<MemberResponse> {
    return this.post<MemberResponse>("/invitations/accept", body);
  }

  /** `POST /invitations/reject` — the invitee declines. */
  reject(body: InvitationTokenRequest): Promise<InvitationResponse> {
    return this.post<InvitationResponse>("/invitations/reject", body);
  }

  private base(organizationId: string): string {
    return `/organizations/${organizationId}/invitations`;
  }
}
