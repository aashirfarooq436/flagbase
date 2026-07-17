import {
  Flag,
  FlagKey,
  RolloutPercentage,
  UserIdListRule,
  type TargetingRule,
} from "@flagbase/core";

import type { FlagDocument, TargetingRuleDocument } from "./mongo-flag.model";

/**
 * Translates between the persisted document and the domain entity.
 *
 * This is where primitives become value objects and back. It's the one place allowed
 * to know both representations — the domain never sees a document, the database never
 * sees an entity. It's also where the discriminated persisted rule shape is matched
 * up with the concrete rule class.
 */
export class FlagMapper {
  static toDomain(document: FlagDocument): Flag {
    return new Flag({
      id: document._id,
      projectId: document.projectId,
      key: new FlagKey(document.key),
      description: document.description,
      enabled: document.enabled,
      targetingRules: document.targetingRules.map(FlagMapper.ruleToDomain),
      rolloutPercentage: new RolloutPercentage(document.rolloutPercentage),
      defaultValue: document.defaultValue,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toDocument(flag: Flag): FlagDocument {
    return {
      _id: flag.id,
      projectId: flag.projectId,
      key: flag.key.value,
      description: flag.description,
      enabled: flag.enabled,
      targetingRules: flag.targetingRules.map(FlagMapper.ruleToDocument),
      rolloutPercentage: flag.rolloutPercentage.value,
      defaultValue: flag.defaultValue,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    };
  }

  private static ruleToDomain(rule: TargetingRuleDocument): TargetingRule {
    switch (rule.type) {
      case "user-id-list":
        return new UserIdListRule(rule.userIds, rule.value);
      default:
        // An unknown persisted rule type means data written by a newer version than
        // this code understands. Failing loudly beats silently dropping a rule and
        // evaluating a flag differently than intended.
        throw new Error(
          `Unknown targeting rule type in persisted flag: ${(rule as { type: string }).type}`,
        );
    }
  }

  private static ruleToDocument(rule: TargetingRule): TargetingRuleDocument {
    if (rule instanceof UserIdListRule) {
      return {
        type: "user-id-list",
        userIds: rule.targetedUserIds(),
        value: rule.value,
      };
    }

    throw new Error(
      `Cannot persist unknown targeting rule type: ${rule.constructor.name}`,
    );
  }
}
