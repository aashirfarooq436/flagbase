import type {
  CreateOrganizationRequest,
  OrganizationResponse,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

export class OrganizationService extends BaseService {
  create(body: CreateOrganizationRequest): Promise<OrganizationResponse> {
    return this.post<OrganizationResponse>("/organizations", body);
  }

  listMine(): Promise<OrganizationResponse[]> {
    return this.get<OrganizationResponse[]>("/organizations");
  }
}
