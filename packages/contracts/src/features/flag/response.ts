/**
 * A targeting rule as it appears in a response. Deliberately its OWN type rather than a
 * reuse of the request-side `TargetingRuleDto`: the outbound shape must be free to diverge
 * from what a client is allowed to send (e.g. a server-assigned rule id) without the
 * inbound validation schema dictating the wire response. Same rationale as RoleDto vs
 * assignableRoleSchema in shared/role.ts.
 */
export type TargetingRuleResponse = {
  type: "user-id-list";
  userIds: string[];
  value: boolean;
};

/**
 * A flag on the wire — flattened and JSON-safe: value objects become primitives
 * (`FlagKey` → string, `RolloutPercentage` → number) and dates become ISO strings. The
 * presenter in the delivery layer builds this from a `Flag` entity.
 */
export type FlagResponse = {
  id: string;
  projectId: string;
  key: string;
  description: string;
  enabled: boolean;
  targetingRules: TargetingRuleResponse[];
  rolloutPercentage: number;
  defaultValue: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The result of the "test this rule" preview. Wrapped in an object so the shape can grow. */
export type EvaluateFlagResponse = {
  value: boolean;
};
