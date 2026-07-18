import { z } from "zod";

const MAX_NAME = 100;

export const createOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
});
export type CreateOrganizationRequest = z.infer<
  typeof createOrganizationRequestSchema
>;

export const renameOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
});
export type RenameOrganizationRequest = z.infer<
  typeof renameOrganizationRequestSchema
>;
