import type {
  CreateProjectRequest,
  ProjectResponse,
  RenameProjectRequest,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/** Projects — nested under an organization: `/api/organizations/:organizationId/projects`. */
export class ProjectService extends BaseService {
  /** `GET …/projects` — the organization's projects. */
  list(organizationId: string): Promise<ProjectResponse[]> {
    return this.get<ProjectResponse[]>(this.base(organizationId));
  }

  /** `POST …/projects` — create a project. */
  create(
    organizationId: string,
    body: CreateProjectRequest,
  ): Promise<ProjectResponse> {
    return this.post<ProjectResponse>(this.base(organizationId), body);
  }

  /** `GET …/projects/:projectId` */
  getById(organizationId: string, projectId: string): Promise<ProjectResponse> {
    return this.get<ProjectResponse>(
      `${this.base(organizationId)}/${projectId}`,
    );
  }

  /** `PATCH …/projects/:projectId` — rename. */
  rename(
    organizationId: string,
    projectId: string,
    body: RenameProjectRequest,
  ): Promise<ProjectResponse> {
    return this.patch<ProjectResponse>(
      `${this.base(organizationId)}/${projectId}`,
      body,
    );
  }

  /** `DELETE …/projects/:projectId` */
  remove(organizationId: string, projectId: string): Promise<void> {
    return this.delete<void>(`${this.base(organizationId)}/${projectId}`);
  }

  private base(organizationId: string): string {
    return `/organizations/${organizationId}/projects`;
  }
}
