import type {
  ChangeMemberRoleRequest,
  MemberResponse,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/** Members — nested under an organization: `/api/organizations/:organizationId/members`. */
export class MemberService extends BaseService {
  /** `GET …/members` — the organization's roster. */
  list(organizationId: string): Promise<MemberResponse[]> {
    return this.get<MemberResponse[]>(this.base(organizationId));
  }

  /** `PATCH …/members/:memberId` — change a member's role (admin | member). */
  changeRole(
    organizationId: string,
    memberId: string,
    body: ChangeMemberRoleRequest,
  ): Promise<MemberResponse> {
    return this.patch<MemberResponse>(
      `${this.base(organizationId)}/${memberId}`,
      body,
    );
  }

  /** `DELETE …/members/:memberId` — remove a member from the organization. */
  remove(organizationId: string, memberId: string): Promise<void> {
    return this.delete<void>(`${this.base(organizationId)}/${memberId}`);
  }

  private base(organizationId: string): string {
    return `/organizations/${organizationId}/members`;
  }
}
