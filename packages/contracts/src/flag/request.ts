import { z } from "zod";

const MAX_DESCRIPTION = 500;

/**
 * A targeting rule on the wire. A discriminated union on `type` so new rule types slot in
 * without touching existing ones — mirroring the domain's OCP design.
 */
export const targetingRuleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user-id-list"),
    userIds: z.array(z.string().min(1)).min(1),
    value: z.boolean(),
  }),
]);
export type TargetingRuleDto = z.infer<typeof targetingRuleSchema>;

export const evaluationContextSchema = z.object({
  key: z.string().min(1),
  attributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
export type EvaluationContextDto = z.infer<typeof evaluationContextSchema>;

/**
 * Client fields only — `organizationId` is NOT here. It comes from the authenticated
 * session, and the route adds it. `key` is checked for shape only (non-empty); the FlagKey
 * value object owns the real format rule (balanced validation).
 */
export const createFlagRequestSchema = z.object({
  projectId: z.string().min(1),
  key: z.string().min(1),
  description: z.string().max(MAX_DESCRIPTION).default(""),
  defaultValue: z.boolean().optional(),
});
export type CreateFlagRequest = z.infer<typeof createFlagRequestSchema>;

export const setFlagEnabledRequestSchema = z.object({
  enabled: z.boolean(),
});
export type SetFlagEnabledRequest = z.infer<typeof setFlagEnabledRequestSchema>;

export const updateFlagRulesRequestSchema = z.object({
  targetingRules: z.array(targetingRuleSchema),
  // A UX-critical format worth encoding at the edge for a clean field error; the
  // RolloutPercentage value object is still the authoritative backstop.
  rolloutPercentage: z.number().int().min(0).max(100),
});
export type UpdateFlagRulesRequest = z.infer<
  typeof updateFlagRulesRequestSchema
>;

export const evaluateFlagRequestSchema = z.object({
  context: evaluationContextSchema,
});
export type EvaluateFlagRequest = z.infer<typeof evaluateFlagRequestSchema>;

/** `GET /flags?projectId=…` — the query, not a body. */
export const listFlagsQuerySchema = z.object({
  projectId: z.string().min(1),
});
export type ListFlagsQuery = z.infer<typeof listFlagsQuerySchema>;
