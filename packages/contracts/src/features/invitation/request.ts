import { z } from "zod";

import { assignableRoleSchema } from "../../shared/role";

export const inviteMemberRequestSchema = z.object({
  email: z.string().email(),
  role: assignableRoleSchema,
});
export type InviteMemberRequest = z.infer<typeof inviteMemberRequestSchema>;

/**
 * The body for accept and reject — both act on the raw invitation token. In the body, not
 * the URL, so the secret token stays out of request logs.
 */
export const invitationTokenRequestSchema = z.object({
  token: z.string().min(1),
});
export type InvitationTokenRequest = z.infer<
  typeof invitationTokenRequestSchema
>;
