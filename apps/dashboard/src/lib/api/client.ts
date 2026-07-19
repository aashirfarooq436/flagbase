import { AuthService } from "./auth.service";
import { FlagService } from "./flag.service";
import { InvitationService } from "./invitation.service";
import { MemberService } from "./member.service";
import { OrganizationService } from "./organization.service";
import { ProjectService } from "./project.service";
import { UserService } from "./user.service";

/**
 * The single client components reach for — `api.organization.listMine()`,
 * `api.flag.setEnabled(...)`. Grouped by feature, mirroring the API routes one-to-one. Provided
 * via context so it can be swapped in tests (see ApiProvider / useApi).
 */
export class ApiClient {
  readonly auth = new AuthService();
  readonly user = new UserService();
  readonly organization = new OrganizationService();
  readonly member = new MemberService();
  readonly invitation = new InvitationService();
  readonly project = new ProjectService();
  readonly flag = new FlagService();
}
