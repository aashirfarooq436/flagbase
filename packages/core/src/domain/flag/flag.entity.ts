/**
 * Flag (persisted shape)
 *   id                 string
 *   projectId          string
 *   key                FlagKey            — immutable; customers hardcode it
 *   description        string
 *   enabled            boolean            — master kill switch, checked first
 *   targetingRules     TargetingRule[]    — ordered; first match wins
 *   rolloutPercentage  RolloutPercentage
 *   defaultValue       boolean            — fallthrough when enabled and nothing matched
 *   createdAt          Date
 *   updatedAt          Date
 */

import { Entity } from "../../shared/entity";
import { ValidationError } from "../../shared/errors";
import type { EvaluationContext } from "./evaluation-context";
import { FlagKey } from "./flag-key.vo";
import { RolloutPercentage } from "./rollout-percentage.vo";
import type { TargetingRule } from "./targeting-rule";

const MAX_DESCRIPTION_LENGTH = 500;

export type FlagProps = {
  id: string;
  projectId: string;
  key: FlagKey;
  description: string;
  enabled: boolean;
  targetingRules: TargetingRule[];
  rolloutPercentage: RolloutPercentage;
  defaultValue: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A feature flag — the domain centerpiece.
 *
 * evaluate() lives here, on the entity, rather than only in a use-case. It's pure
 * domain logic with no orchestration and no I/O: it *is* the business rule of a flag.
 * The use-case that wraps it just loads a flag and calls it (for the dashboard's "test
 * this rule" preview); the v2 SDK, holding a cached flag, will call it with no use-case
 * in the path at all.
 */
export class Flag extends Entity {
  readonly projectId: string;
  /** Immutable: no setter. It's the identifier customers hardcode; renaming is delete-and-recreate. */
  readonly key: FlagKey;
  readonly createdAt: Date;

  private _description: string;
  private _enabled: boolean;
  private _targetingRules: TargetingRule[];
  private _rolloutPercentage: RolloutPercentage;
  private _defaultValue: boolean;
  private _updatedAt: Date;

  constructor(props: FlagProps) {
    super(props.id);

    Flag.assertValidDescription(props.description);

    this.projectId = props.projectId;
    this.key = props.key;
    this.createdAt = props.createdAt;
    this._description = props.description;
    this._enabled = props.enabled;
    this._targetingRules = [...props.targetingRules];
    this._rolloutPercentage = props.rolloutPercentage;
    this._defaultValue = props.defaultValue;
    this._updatedAt = props.updatedAt;
  }

  /**
   * A new flag starts disabled, with no rules and a 0% rollout.
   *
   * Ships dark by default: creating a flag never exposes a feature to anyone until
   * someone deliberately turns it on. defaultValue is the value served once enabled
   * and nothing else has matched — false unless stated otherwise.
   */
  static create(input: {
    id: string;
    projectId: string;
    key: FlagKey;
    description: string;
    defaultValue?: boolean;
    now: Date;
  }): Flag {
    return new Flag({
      id: input.id,
      projectId: input.projectId,
      key: input.key,
      description: input.description,
      enabled: false,
      targetingRules: [],
      rolloutPercentage: RolloutPercentage.none(),
      defaultValue: input.defaultValue ?? false,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  /**
   * Resolve this flag to true or false for a given subject.
   *
   * Order is the contract, and the disabled check comes first for a reason: it's a
   * true kill switch. Turning a flag off overrides everything — including a targeting
   * rule that names a user explicitly. That's the headline product promise ("seconds,
   * not an incident response"), and it only holds because nothing is consulted before
   * this line.
   *
   * When enabled: the first matching rule wins; otherwise the percentage bucket
   * decides; otherwise the default value is served.
   */
  evaluate(context: EvaluationContext): boolean {
    if (!this._enabled) {
      return false;
    }

    for (const rule of this._targetingRules) {
      if (rule.matches(context)) {
        return rule.value;
      }
    }

    if (this._rolloutPercentage.includes(context.key, this.key.value)) {
      return true;
    }

    return this._defaultValue;
  }

  get description(): string {
    return this._description;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get targetingRules(): readonly TargetingRule[] {
    return this._targetingRules;
  }

  get rolloutPercentage(): RolloutPercentage {
    return this._rolloutPercentage;
  }

  get defaultValue(): boolean {
    return this._defaultValue;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  enable(now: Date): void {
    this._enabled = true;
    this.touch(now);
  }

  disable(now: Date): void {
    this._enabled = false;
    this.touch(now);
  }

  updateRules(
    rules: TargetingRule[],
    rollout: RolloutPercentage,
    now: Date,
  ): void {
    this._targetingRules = [...rules];
    this._rolloutPercentage = rollout;
    this.touch(now);
  }

  setDefaultValue(value: boolean, now: Date): void {
    this._defaultValue = value;
    this.touch(now);
  }

  changeDescription(description: string, now: Date): void {
    Flag.assertValidDescription(description);
    this._description = description;
    this.touch(now);
  }

  private touch(now: Date): void {
    this._updatedAt = now;
  }

  private static assertValidDescription(description: string): void {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(
        `Flag description must be at most ${MAX_DESCRIPTION_LENGTH} characters, received ${description.length}`,
      );
    }
  }
}
