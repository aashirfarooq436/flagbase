import type {
  CreateOrganizationRequest,
  OrganizationResponse,
  RenameOrganizationRequest,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/** Organizations — `/api/organizations`. */
export class OrganizationService extends BaseService {
  /** `GET /organizations` — the organizations the current user belongs to. */
  listMine(): Promise<OrganizationResponse[]> {
    return this.get<OrganizationResponse[]>("/organizations");
  }

  /** `POST /organizations` — create an org (the caller becomes its owner). */
  create(body: CreateOrganizationRequest): Promise<OrganizationResponse> {
    return this.post<OrganizationResponse>("/organizations", body);
  }

  /** `GET /organizations/:organizationId` */
  getById(organizationId: string): Promise<OrganizationResponse> {
    return this.get<OrganizationResponse>(`/organizations/${organizationId}`);
  }

  /** `PATCH /organizations/:organizationId` — rename. */
  rename(
    organizationId: string,
    body: RenameOrganizationRequest,
  ): Promise<OrganizationResponse> {
    return this.patch<OrganizationResponse>(
      `/organizations/${organizationId}`,
      body,
    );
  }
}
