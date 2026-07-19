import { z } from "zod";

import { assignableRoleSchema } from "../../shared/role";

export const changeMemberRoleRequestSchema = z.object({
  role: assignableRoleSchema,
});
export type ChangeMemberRoleRequest = z.infer<
  typeof changeMemberRoleRequestSchema
>;
