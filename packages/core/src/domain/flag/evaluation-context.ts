/**
 * The subject a flag is evaluated against.
 *
 * Deliberately NOT called UserContext. FlagBase has a User entity — someone who logs
 * into the dashboard. The subject of an evaluation is the *customer's* end user, an
 * entirely different person. Two things named `User` meaning different people would be
 * a standing source of bugs.
 *
 * `key` is required because percentage rollout has nothing to bucket without a stable
 * identifier. Evaluating for anonymous traffic means the caller supplies something
 * stable themselves — a session id. (Whether to allow an optional key that skips
 * rollout is an open question, deferred until the v2 SDK's public API; see
 * docs/DOMAIN_MODEL.md §11.)
 *
 * `attributes` exists for v2 attribute-based targeting and is unused by v1's single
 * rule type.
 */
export type EvaluationContext = {
  key: string;
  attributes?: Record<string, string | number | boolean>;
};
