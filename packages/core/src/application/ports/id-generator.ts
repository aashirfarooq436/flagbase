/** Mints entity ids. Implemented with crypto.randomUUID in infrastructure. */
export interface IIdGenerator {
  generate(): string;
}
