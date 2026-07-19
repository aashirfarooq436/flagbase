import type {
  CreateFlagRequest,
  EvaluateFlagRequest,
  EvaluateFlagResponse,
  FlagResponse,
  SetFlagEnabledRequest,
  UpdateFlagRulesRequest,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/**
 * Feature flags — nested under a project:
 * `/api/organizations/:organizationId/projects/:projectId/flags`.
 */
export class FlagService extends BaseService {
  /** `GET …/flags` — the project's flags. */
  list(organizationId: string, projectId: string): Promise<FlagResponse[]> {
    return this.get<FlagResponse[]>(this.base(organizationId, projectId));
  }

  /** `POST …/flags` — create a flag (projectId comes from the path, not the body). */
  create(
    organizationId: string,
    projectId: string,
    body: CreateFlagRequest,
  ): Promise<FlagResponse> {
    return this.post<FlagResponse>(this.base(organizationId, projectId), body);
  }

  /** `GET …/flags/:flagId` */
  getById(
    organizationId: string,
    projectId: string,
    flagId: string,
  ): Promise<FlagResponse> {
    return this.get<FlagResponse>(
      `${this.base(organizationId, projectId)}/${flagId}`,
    );
  }

  /** `PATCH …/flags/:flagId` — flip the kill switch (`enabled`). */
  setEnabled(
    organizationId: string,
    projectId: string,
    flagId: string,
    body: SetFlagEnabledRequest,
  ): Promise<FlagResponse> {
    return this.patch<FlagResponse>(
      `${this.base(organizationId, projectId)}/${flagId}`,
      body,
    );
  }

  /** `PUT …/flags/:flagId/rules` — replace targeting rules + rollout percentage. */
  updateRules(
    organizationId: string,
    projectId: string,
    flagId: string,
    body: UpdateFlagRulesRequest,
  ): Promise<FlagResponse> {
    return this.put<FlagResponse>(
      `${this.base(organizationId, projectId)}/${flagId}/rules`,
      body,
    );
  }

  /** `POST …/flags/:flagId/evaluate` — server-side preview for an evaluation context. */
  evaluate(
    organizationId: string,
    projectId: string,
    flagId: string,
    body: EvaluateFlagRequest,
  ): Promise<EvaluateFlagResponse> {
    return this.post<EvaluateFlagResponse>(
      `${this.base(organizationId, projectId)}/${flagId}/evaluate`,
      body,
    );
  }

  /** `DELETE …/flags/:flagId` */
  remove(
    organizationId: string,
    projectId: string,
    flagId: string,
  ): Promise<void> {
    return this.delete<void>(
      `${this.base(organizationId, projectId)}/${flagId}`,
    );
  }

  private base(organizationId: string, projectId: string): string {
    return `/organizations/${organizationId}/projects/${projectId}/flags`;
  }
}
