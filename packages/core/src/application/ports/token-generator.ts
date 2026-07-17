/**
 * Mints high-entropy secrets: invitation tokens now, project API keys in v2.
 *
 * Separate from IIdGenerator despite the identical shape. Ids are public and appear in
 * URLs; tokens are secrets that must be unguessable. Keeping them apart stops the two
 * from being casually swapped at a call site where it would matter.
 */
export interface ITokenGenerator {
  generate(): string;
}
