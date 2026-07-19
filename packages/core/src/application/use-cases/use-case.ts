/**
 * The shape every use-case implements.
 *
 * A use-case is one application operation: it takes plain input, orchestrates entities,
 * repositories, and ports to carry it out, and returns a result. It's the only layer
 * that coordinates across aggregates — entities hold invariants, use-cases hold workflows.
 *
 * Dependencies (repository interfaces, ports) are injected via the constructor as
 * interfaces, never constructed internally — that's what makes a use-case testable with
 * in-memory fakes and is the concrete payoff of the Dependency Inversion Principle.
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
