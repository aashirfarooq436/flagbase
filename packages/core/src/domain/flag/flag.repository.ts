import type { Flag } from "./flag.entity";
import type { FlagKey } from "./flag-key.vo";

export interface IFlagRepository {
  findById(id: string): Promise<Flag | null>;
  /** Enforces key uniqueness within a project, and is the lookup the v2 SDK's rules endpoint uses. */
  findByProjectAndKey(projectId: string, key: FlagKey): Promise<Flag | null>;
  findByProjectId(projectId: string): Promise<Flag[]>;
  save(flag: Flag): Promise<void>;
  delete(id: string): Promise<void>;
}
