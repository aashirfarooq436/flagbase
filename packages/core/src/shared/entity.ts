/**
 * Base for things with identity.
 *
 * The entity/value-object split, made explicit rather than conventional: two Flags
 * with the same id are the same flag even if every other field differs, whereas two
 * RolloutPercentage(50) are simply interchangeable. Identity is what entities have
 * and value objects don't.
 */
export abstract class Entity {
  protected constructor(readonly id: string) {}

  equals(other: Entity): boolean {
    // Comparing constructors as well as ids: an Org and a Flag that happen to share
    // an id string are not the same thing.
    return other.constructor === this.constructor && other.id === this.id;
  }
}
