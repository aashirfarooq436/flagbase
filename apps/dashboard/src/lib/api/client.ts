import { AuthService } from "./auth.service";
import { OrganizationService } from "./organization.service";

/**
 * The single client components reach for: `api.auth.signIn(...)`, `api.organization.listMine()`.
 * Grouped by feature, mirroring the API routes. Provided via context so it can be swapped in
 * tests (see ApiProvider / useApi).
 */
export class ApiClient {
  readonly auth = new AuthService();
  readonly organization = new OrganizationService();
}
